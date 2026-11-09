import { query, AuthUser, signToken } from './db';
import bcrypt from 'bcryptjs';

// Format helper
function toNum(val: any): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export const productService = {
  async getAll() {
    const rows = await query(`
      SELECT * FROM products 
      WHERE "isDeleted" = false AND "isActive" = true 
      ORDER BY "createdAt" DESC
    `);
    return rows.map((r) => ({
      ...r,
      price: toNum(r.price),
      stock: toNum(r.stock),
    }));
  },

  async getById(id: string) {
    const rows = await query(`SELECT * FROM products WHERE id = $1 AND "isDeleted" = false`, [id]);
    if (!rows.length) return null;
    return {
      ...rows[0],
      price: toNum(rows[0].price),
      stock: toNum(rows[0].stock),
    };
  },

  async adminGetAll() {
    const rows = await query(`SELECT * FROM products WHERE "isDeleted" = false ORDER BY "createdAt" DESC`);
    return rows.map((r) => ({
      ...r,
      price: toNum(r.price),
      stock: toNum(r.stock),
    }));
  },

  async adminCreate(data: any) {
    const id = crypto.randomUUID();
    const rows = await query(
      `
      INSERT INTO products (id, name, price, description, category, "imageUrl", "isActive", "trackInventory", stock, "isDeleted", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW(), NOW())
      RETURNING *
    `,
      [
        id,
        data.name || 'محصول جدید',
        toNum(data.price),
        data.description || '',
        data.category || 'تنقلات',
        data.imageUrl || '',
        data.isActive !== undefined ? data.isActive : true,
        data.trackInventory !== undefined ? data.trackInventory : true,
        toNum(data.stock),
      ]
    );
    return {
      ...rows[0],
      price: toNum(rows[0].price),
      stock: toNum(rows[0].stock),
    };
  },

  async adminUpdate(id: string, data: any) {
    const existing = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!existing.length) throw new Error('محصول پیدا نشد');

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowed = ['name', 'price', 'description', 'category', 'imageUrl', 'isActive', 'trackInventory', 'stock'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`"${key}" = $${idx}`);
        values.push(key === 'price' || key === 'stock' ? toNum(data[key]) : data[key]);
        idx++;
      }
    }
    fields.push(`"updatedAt" = NOW()`);
    values.push(id);

    const rows = await query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return {
      ...rows[0],
      price: toNum(rows[0].price),
      stock: toNum(rows[0].stock),
    };
  },

  async adminDelete(id: string) {
    await query(`UPDATE products SET "isDeleted" = true, "updatedAt" = NOW() WHERE id = $1`, [id]);
    return { success: true };
  },

  async adminRestock(id: string, quantityChange: number, reason: string, adminId?: string, setExact?: boolean) {
    const rows = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!rows.length) throw new Error('محصول پیدا نشد');
    const p = rows[0];

    const currentStock = toNum(p.stock);
    const newStock = setExact ? quantityChange : currentStock + quantityChange;
    const finalChange = setExact ? newStock - currentStock : quantityChange;

    await query(`UPDATE products SET stock = $1, "updatedAt" = NOW() WHERE id = $2`, [newStock, id]);

    const movementId = crypto.randomUUID();
    await query(
      `
      INSERT INTO inventory_movements (id, "productId", type, "quantityChange", "stockBefore", "stockAfter", reason, "adminId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `,
      [
        movementId,
        id,
        finalChange >= 0 ? 'RESTOCK' : 'ADJUSTMENT',
        finalChange,
        currentStock,
        newStock,
        reason || 'شارژ مجدد توسط مدیر',
        adminId || null,
      ]
    );

    return {
      ...p,
      stock: newStock,
      price: toNum(p.price),
    };
  },

  async getMovements(productId: string) {
    return query(`SELECT * FROM inventory_movements WHERE "productId" = $1 ORDER BY "createdAt" DESC`, [productId]);
  },
};

export const authService = {
  async login(mobile: string, pass: string) {
    const rows = await query(`SELECT * FROM users WHERE mobile = $1`, [mobile.trim()]);
    if (!rows.length) {
      throw new Error('شماره موبایل یا رمز عبور اشتباه است');
    }
    const user = rows[0];
    const isMatch = bcrypt.compareSync(pass, user.passwordHash);
    if (!isMatch) {
      throw new Error('شماره موبایل یا رمز عبور اشتباه است');
    }
    if (!user.isActive) {
      throw new Error('حساب کاربری شما غیرفعال شده است');
    }

    const authUser: AuthUser = {
      id: user.id,
      mobile: user.mobile,
      role: user.role,
      name: user.name,
    };
    const token = signToken(authUser);
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        isActive: user.isActive,
      },
    };
  },

  async register(name: string, mobile: string, pass: string) {
    const cleanMobile = mobile.trim();
    const existing = await query(`SELECT id FROM users WHERE mobile = $1`, [cleanMobile]);
    if (existing.length) {
      throw new Error('کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است');
    }

    const userId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(pass, 10);
    const userRows = await query(
      `
      INSERT INTO users (id, name, mobile, "passwordHash", role, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'customer', true, NOW(), NOW())
      RETURNING *
    `,
      [userId, name.trim(), cleanMobile, passwordHash]
    );

    // Create wallet
    const walletId = crypto.randomUUID();
    await query(
      `
      INSERT INTO wallets (id, "userId", balance, "updatedAt")
      VALUES ($1, $2, 0, NOW())
    `,
      [walletId, userId]
    );

    const user = userRows[0];
    const authUser: AuthUser = {
      id: user.id,
      mobile: user.mobile,
      role: user.role,
      name: user.name,
    };
    const token = signToken(authUser);
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        isActive: user.isActive,
      },
    };
  },

  async getMe(userId: string) {
    const rows = await query(`SELECT id, name, mobile, role, "isActive" FROM users WHERE id = $1`, [userId]);
    if (!rows.length) throw new Error('کاربر یافت نشد');
    return rows[0];
  },
};

export const walletService = {
  async getWallet(userId: string) {
    let rows = await query(`SELECT * FROM wallets WHERE "userId" = $1`, [userId]);
    if (!rows.length) {
      const id = crypto.randomUUID();
      rows = await query(`INSERT INTO wallets (id, "userId", balance, "updatedAt") VALUES ($1, $2, 0, NOW()) RETURNING *`, [
        id,
        userId,
      ]);
    }
    return {
      id: rows[0].id,
      userId: rows[0].userId,
      balance: toNum(rows[0].balance),
      updatedAt: rows[0].updatedAt,
    };
  },

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.getWallet(userId);
    const offset = (page - 1) * limit;

    const countRows = await query(`SELECT count(*) FROM wallet_transactions WHERE "walletId" = $1`, [wallet.id]);
    const total = toNum(countRows[0].count);

    const rows = await query(
      `
      SELECT * FROM wallet_transactions 
      WHERE "walletId" = $1 
      ORDER BY "createdAt" DESC 
      LIMIT $2 OFFSET $3
    `,
      [wallet.id, limit, offset]
    );

    return {
      transactions: rows.map((r) => ({
        ...r,
        amount: toNum(r.amount),
        balanceBefore: toNum(r.balanceBefore),
        balanceAfter: toNum(r.balanceAfter),
      })),
      total,
    };
  },

  async startTopUp(userId: string, amount: number, origin: string) {
    if (amount < 1000) {
      throw new Error('حداقل مبلغ شارژ ۱,۰۰۰ تومان است');
    }

    const topUpId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();

    // Create topup
    await query(
      `
      INSERT INTO wallet_topups (id, "userId", amount, status, "paymentId", "createdAt")
      VALUES ($1, $2, $3, 'PENDING', $4, NOW())
    `,
      [topUpId, userId, amount, paymentId]
    );

    // Create payment
    await query(
      `
      INSERT INTO payments (id, "topUpId", "userId", provider, mode, amount, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, 'zarinpal', 'SANDBOX', $4, 'PENDING', NOW(), NOW())
    `,
      [paymentId, topUpId, userId, amount]
    );

    // Call ZarinPal SandBox REST v4
    const callbackUrl = `${origin}/api/v1/payments/callback/zarinpal?paymentId=${paymentId}`;
    try {
      const zpRes = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          merchant_id: '00000000-0000-0000-0000-000000000000',
          amount,
          currency: 'IRT',
          description: `شارژ کیف‌پول بوفه رُکاد - کاربر ${userId.slice(0, 8)}`,
          callback_url: callbackUrl,
        }),
      });

      const zpData = await zpRes.json();
      if (zpData.data && (zpData.data.code === 100 || zpData.data.code === 101)) {
        const authority = zpData.data.authority;
        await query(`UPDATE payments SET "authorityOrToken" = $1 WHERE id = $2`, [authority, paymentId]);
        return {
          topUpId,
          paymentId,
          redirectUrl: `https://sandbox.zarinpal.com/pg/StartPay/${authority}`,
        };
      }
    } catch (e) {
      console.warn('Zarinpal sandbox call error, using local fallback:', e);
    }

    // Fallback: direct sandbox page
    return {
      topUpId,
      paymentId,
      redirectUrl: `${origin}/pay/sandbox?paymentId=${paymentId}&amount=${amount}`,
    };
  },

  async getTopUpStatus(topUpId: string) {
    const rows = await query(`SELECT * FROM wallet_topups WHERE id = $1`, [topUpId]);
    if (!rows.length) throw new Error('شارژ یافت نشد');
    const topUp = rows[0];
    const wallet = await this.getWallet(topUp.userId);
    return {
      status: topUp.status,
      amount: toNum(topUp.amount),
      balance: wallet.balance,
    };
  },
};

export const orderService = {
  async create(userId: string, items: { productId: string; quantity: number }[], origin: string) {
    if (!items || !items.length) {
      throw new Error('سبد خرید نمی‌تواند خالی باشد');
    }

    // Validate products and compute subtotal
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const it of items) {
      const pRows = await query(`SELECT * FROM products WHERE id = $1 AND "isDeleted" = false`, [it.productId]);
      if (!pRows.length) throw new Error(`محصول نامعتبر است`);
      const prod = pRows[0];
      const unitPrice = toNum(prod.price);
      const qty = Math.max(1, it.quantity);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      orderItemsData.push({
        id: crypto.randomUUID(),
        productId: prod.id,
        productName: prod.name,
        unitPrice,
        quantity: qty,
        lineTotal,
      });
    }

    const wallet = await walletService.getWallet(userId);
    const orderId = crypto.randomUUID();

    if (wallet.balance >= subtotal) {
      // Full wallet payment
      const newBal = wallet.balance - subtotal;
      await query(`UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [newBal, wallet.id]);

      // Record wallet transaction
      await query(
        `
        INSERT INTO wallet_transactions (id, "walletId", type, amount, "balanceBefore", "balanceAfter", description, "createdAt")
        VALUES ($1, $2, 'DEBIT', $3, $4, $5, $6, NOW())
      `,
        [crypto.randomUUID(), wallet.id, subtotal, wallet.balance, newBal, `خرید از بوفه (سفارش #${orderId.slice(0, 6)})`]
      );

      // Create PAID order
      await query(
        `
        INSERT INTO orders (id, "userId", status, subtotal, "walletDeduction", "gatewayAmount", total, "paidAt", "completedAt", "createdAt", "updatedAt")
        VALUES ($1, $2, 'PAID', $3, $4, 0, $5, NOW(), NOW(), NOW(), NOW())
      `,
        [orderId, userId, subtotal, subtotal, subtotal]
      );

      // Insert items and decrease stock
      for (const oi of orderItemsData) {
        await query(
          `
          INSERT INTO order_items (id, "orderId", "productId", "productName", "unitPrice", quantity, "lineTotal")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [oi.id, orderId, oi.productId, oi.productName, oi.unitPrice, oi.quantity, oi.lineTotal]
        );
        await query(`UPDATE products SET stock = GREATEST(0, stock - $1), "updatedAt" = NOW() WHERE id = $2`, [
          oi.quantity,
          oi.productId,
        ]);
      }

      return {
        order: { id: orderId, status: 'PAID', total: subtotal, subtotal },
        paymentNeeded: false,
      };
    } else {
      // Gateway needed for remaining amount
      const walletDeduction = wallet.balance > 0 ? wallet.balance : 0;
      const gatewayAmount = subtotal - walletDeduction;

      await query(
        `
        INSERT INTO orders (id, "userId", status, subtotal, "walletDeduction", "gatewayAmount", total, "paymentProvider", "createdAt", "updatedAt")
        VALUES ($1, $2, 'PENDING', $3, $4, $5, $6, 'zarinpal', NOW(), NOW())
      `,
        [orderId, userId, subtotal, walletDeduction, gatewayAmount, subtotal]
      );

      for (const oi of orderItemsData) {
        await query(
          `
          INSERT INTO order_items (id, "orderId", "productId", "productName", "unitPrice", quantity, "lineTotal")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [oi.id, orderId, oi.productId, oi.productName, oi.unitPrice, oi.quantity, oi.lineTotal]
        );
      }

      // Create payment
      const paymentId = crypto.randomUUID();
      await query(
        `
        INSERT INTO payments (id, "orderId", "userId", provider, mode, amount, status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'zarinpal', 'SANDBOX', $4, 'PENDING', NOW(), NOW())
      `,
        [paymentId, orderId, userId, gatewayAmount]
      );

      const callbackUrl = `${origin}/api/v1/payments/callback/zarinpal?paymentId=${paymentId}`;
      let paymentUrl = `${origin}/pay/sandbox?paymentId=${paymentId}&amount=${gatewayAmount}`;

      try {
        const zpRes = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            merchant_id: '00000000-0000-0000-0000-000000000000',
            amount: gatewayAmount,
            currency: 'IRT',
            description: `پرداخت سفارش #${orderId.slice(0, 6)} بوفه رُکاد`,
            callback_url: callbackUrl,
          }),
        });
        const zpData = await zpRes.json();
        if (zpData.data && (zpData.data.code === 100 || zpData.data.code === 101)) {
          const authority = zpData.data.authority;
          await query(`UPDATE payments SET "authorityOrToken" = $1 WHERE id = $2`, [authority, paymentId]);
          paymentUrl = `https://sandbox.zarinpal.com/pg/StartPay/${authority}`;
        }
      } catch (e) {
        console.warn('Zarinpal request error:', e);
      }

      return {
        order: { id: orderId, status: 'PENDING', total: subtotal, gatewayAmount },
        paymentNeeded: true,
        paymentUrl,
      };
    }
  },

  async getAll(userId: string, page = 1, limit = 30) {
    const offset = (page - 1) * limit;
    const countRows = await query(`SELECT count(*) FROM orders WHERE "userId" = $1`, [userId]);
    const total = toNum(countRows[0].count);

    const orders = await query(
      `SELECT * FROM orders WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    for (const o of orders) {
      o.items = await query(`SELECT * FROM order_items WHERE "orderId" = $1`, [o.id]);
      o.subtotal = toNum(o.subtotal);
      o.total = toNum(o.total);
      o.walletDeduction = toNum(o.walletDeduction);
      o.gatewayAmount = toNum(o.gatewayAmount);
    }

    return { orders, total };
  },

  async getById(id: string, userId: string) {
    const rows = await query(`SELECT * FROM orders WHERE id = $1 AND "userId" = $2`, [id, userId]);
    if (!rows.length) throw new Error('سفارش یافت نشد');
    const order = rows[0];
    order.items = await query(`SELECT * FROM order_items WHERE "orderId" = $1`, [id]);
    order.subtotal = toNum(order.subtotal);
    order.total = toNum(order.total);
    return order;
  },

  async cancel(id: string, userId: string) {
    const rows = await query(`SELECT * FROM orders WHERE id = $1 AND "userId" = $2`, [id, userId]);
    if (!rows.length) throw new Error('سفارش یافت نشد');
    const order = rows[0];
    if (order.status !== 'PENDING') throw new Error('فقط سفارش‌های در انتظار پرداخت قابل لغو هستند');

    await query(`UPDATE orders SET status = 'CANCELLED', "updatedAt" = NOW() WHERE id = $1`, [id]);
    return { ...order, status: 'CANCELLED' };
  },

  async startOrderPayment(orderId: string, userId: string, origin: string) {
    const rows = await query(`SELECT * FROM orders WHERE id = $1 AND "userId" = $2`, [orderId, userId]);
    if (!rows.length) throw new Error('سفارش یافت نشد');
    const order = rows[0];
    const amount = toNum(order.gatewayAmount) || toNum(order.total);

    let payRows = await query(`SELECT * FROM payments WHERE "orderId" = $1 AND status = 'PENDING'`, [orderId]);
    let paymentId: string;
    if (payRows.length) {
      paymentId = payRows[0].id;
    } else {
      paymentId = crypto.randomUUID();
      await query(
        `INSERT INTO payments (id, "orderId", "userId", provider, mode, amount, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'zarinpal', 'SANDBOX', $4, 'PENDING', NOW(), NOW())`,
        [paymentId, orderId, userId, amount]
      );
    }

    const callbackUrl = `${origin}/api/v1/payments/callback/zarinpal?paymentId=${paymentId}`;
    let redirectUrl = `${origin}/pay/sandbox?paymentId=${paymentId}&amount=${amount}`;

    try {
      const zpRes = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          merchant_id: '00000000-0000-0000-0000-000000000000',
          amount,
          currency: 'IRT',
          description: `پرداخت سفارش #${orderId.slice(0, 6)} بوفه رُکاد`,
          callback_url: callbackUrl,
        }),
      });
      const zpData = await zpRes.json();
      if (zpData.data && (zpData.data.code === 100 || zpData.data.code === 101)) {
        const authority = zpData.data.authority;
        await query(`UPDATE payments SET "authorityOrToken" = $1 WHERE id = $2`, [authority, paymentId]);
        redirectUrl = `https://sandbox.zarinpal.com/pg/StartPay/${authority}`;
      }
    } catch (e) {
      console.warn('Zarinpal start payment error:', e);
    }

    return {
      redirectUrl,
      paymentId,
      provider: 'zarinpal',
    };
  },
};

export const paymentService = {
  async handleCallback(provider: string, authority: string | null, status: string | null, paymentId: string | null, origin: string) {
    let pRows: any[] = [];
    if (paymentId) {
      pRows = await query(`SELECT * FROM payments WHERE id = $1`, [paymentId]);
    } else if (authority) {
      pRows = await query(`SELECT * FROM payments WHERE "authorityOrToken" = $1`, [authority]);
    }

    if (!pRows.length) {
      return `${origin}/pay/result?status=failed&message=تراکنش_یافت_نشد`;
    }

    const payment = pRows[0];
    const amount = toNum(payment.amount);

    if (status === 'OK' || status === 'success') {
      let refId = payment.referenceId || String(Math.floor(10000000 + Math.random() * 90000000));

      // Try ZarinPal verify
      if (authority && authority !== 'MOCK_SANDBOX_AUTHORITY') {
        try {
          const vRes = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/verify.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              merchant_id: '00000000-0000-0000-0000-000000000000',
              amount,
              authority,
            }),
          });
          const vData = await vRes.json();
          if (vData.data && (vData.data.code === 100 || vData.data.code === 101)) {
            refId = String(vData.data.ref_id);
          }
        } catch (e) {
          console.warn('Verify call warning:', e);
        }
      }

      // Mark payment SUCCESS
      await query(
        `UPDATE payments SET status = 'SUCCESS', "referenceId" = $1, "verifiedAt" = NOW(), "updatedAt" = NOW() WHERE id = $2`,
        [refId, payment.id]
      );

      // Fulfill TopUp
      if (payment.topUpId) {
        await query(`UPDATE wallet_topups SET status = 'COMPLETED' WHERE id = $1`, [payment.topUpId]);
        const wRows = await query(`SELECT * FROM wallets WHERE "userId" = $1`, [payment.userId]);
        if (wRows.length) {
          const w = wRows[0];
          const oldBal = toNum(w.balance);
          const newBal = oldBal + amount;
          await query(`UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [newBal, w.id]);
          await query(
            `
            INSERT INTO wallet_transactions (id, "walletId", type, amount, "balanceBefore", "balanceAfter", "referenceId", description, "createdAt")
            VALUES ($1, $2, 'CREDIT', $3, $4, $5, $6, 'شارژ آنلاین کیف‌پول', NOW())
          `,
            [crypto.randomUUID(), w.id, amount, oldBal, newBal, refId]
          );
        }
      }

      // Fulfill Order
      if (payment.orderId) {
        await query(
          `UPDATE orders SET status = 'PAID', "paidAt" = NOW(), "completedAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`,
          [payment.orderId]
        );
        const oi = await query(`SELECT * FROM order_items WHERE "orderId" = $1`, [payment.orderId]);
        for (const item of oi) {
          await query(`UPDATE products SET stock = GREATEST(0, stock - $1), "updatedAt" = NOW() WHERE id = $2`, [
            item.quantity,
            item.productId,
          ]);
        }
      }

      return `${origin}/pay/result?status=success&ref_id=${refId}&amount=${amount}&payment_id=${payment.id}`;
    } else {
      await query(`UPDATE payments SET status = 'FAILED', "updatedAt" = NOW() WHERE id = $1`, [payment.id]);
      if (payment.topUpId) {
        await query(`UPDATE wallet_topups SET status = 'FAILED' WHERE id = $1`, [payment.topUpId]);
      }
      return `${origin}/pay/result?status=failed&message=تراکنش_توسط_کاربر_لغو_شد&payment_id=${payment.id}`;
    }
  },

  async sandboxAction(paymentId: string, action: 'success' | 'failed' | 'cancel', origin: string) {
    const status = action === 'success' ? 'OK' : 'NOK';
    return this.handleCallback('zarinpal', 'MOCK_SANDBOX_AUTHORITY', status, paymentId, origin);
  },

  async getMinePayment(paymentId: string, userId: string) {
    const rows = await query(`SELECT * FROM payments WHERE id = $1 AND "userId" = $2`, [paymentId, userId]);
    if (!rows.length) throw new Error('پرداخت یافت نشد');
    const p = rows[0];
    let order: any = null;
    if (p.orderId) {
      const oRows = await query(`SELECT * FROM orders WHERE id = $1`, [p.orderId]);
      order = oRows[0] || null;
    }
    return {
      payment: {
        ...p,
        amount: toNum(p.amount),
      },
      order,
    };
  },
};

export const adminService = {
  async getDashboard() {
    const today = new Date().toISOString().slice(0, 10);

    const salesRow = await query(
      `SELECT COALESCE(SUM(total), 0) as sales, count(*) as count FROM orders WHERE status = 'PAID' AND "createdAt"::text LIKE $1`,
      [`${today}%`]
    );
    const usersRow = await query(`SELECT count(*) as count FROM users`);
    const walletRow = await query(`SELECT COALESCE(SUM(balance), 0) as balance FROM wallets`);
    const activeProdRow = await query(`SELECT count(*) as count FROM products WHERE "isActive" = true AND "isDeleted" = false`);
    const soldOutRow = await query(`SELECT count(*) as count FROM products WHERE stock <= 0 AND "isDeleted" = false`);

    const recentOrders = await query(`SELECT * FROM orders ORDER BY "createdAt" DESC LIMIT 8`);
    for (const o of recentOrders) {
      o.total = toNum(o.total);
      o.subtotal = toNum(o.subtotal);
    }

    const recentFailed = await query(`SELECT * FROM payments WHERE status = 'FAILED' ORDER BY "createdAt" DESC LIMIT 5`);

    return {
      kpis: {
        todaySales: toNum(salesRow[0].sales),
        todayOrdersCount: toNum(salesRow[0].count),
        totalUsers: toNum(usersRow[0].count),
        totalWalletBalance: toNum(walletRow[0].balance),
        activeProductsCount: toNum(activeProdRow[0].count),
        soldOutProductsCount: toNum(soldOutRow[0].count),
      },
      recentOrders,
      recentFailedPayments: recentFailed.map((f) => ({ ...f, amount: toNum(f.amount) })),
    };
  },

  async getUsers(search?: string) {
    let sql = `SELECT id, name, mobile, role, "isActive", "createdAt" FROM users`;
    const params: any[] = [];
    if (search) {
      sql += ` WHERE name ILIKE $1 OR mobile ILIKE $1`;
      params.push(`%${search}%`);
    }
    sql += ` ORDER BY "createdAt" DESC`;
    return query(sql, params);
  },

  async adjustWallet(userId: string, amount: number, type: 'CREDIT' | 'DEBIT', reason: string) {
    const w = await walletService.getWallet(userId);
    const adjAmount = Math.abs(amount);
    const oldBal = w.balance;
    const newBal = type === 'CREDIT' ? oldBal + adjAmount : Math.max(0, oldBal - adjAmount);

    await query(`UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [newBal, w.id]);

    const txId = crypto.randomUUID();
    const txRows = await query(
      `
      INSERT INTO wallet_transactions (id, "walletId", type, amount, "balanceBefore", "balanceAfter", description, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `,
      [txId, w.id, type, adjAmount, oldBal, newBal, reason || 'تغییر دستی توسط مدیریت']
    );

    return {
      wallet: { ...w, balance: newBal },
      transaction: txRows[0],
    };
  },

  async toggleUserActive(userId: string, isActive: boolean) {
    const rows = await query(`UPDATE users SET "isActive" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`, [
      isActive,
      userId,
    ]);
    return rows[0];
  },

  async getOrders(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 30;
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM orders WHERE 1=1`;
    const qParams: any[] = [];
    let idx = 1;

    if (params?.status) {
      sql += ` AND status = $${idx++}`;
      qParams.push(params.status);
    }
    sql += ` ORDER BY "createdAt" DESC LIMIT $${idx++} OFFSET $${idx++}`;
    qParams.push(limit, offset);

    const orders = await query(sql, qParams);
    for (const o of orders) {
      o.items = await query(`SELECT * FROM order_items WHERE "orderId" = $1`, [o.id]);
      o.total = toNum(o.total);
      o.subtotal = toNum(o.subtotal);
    }

    const cRows = await query(`SELECT count(*) FROM orders`);
    return { orders, total: toNum(cRows[0].count) };
  },

  async getPayments(params?: { status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 30;
    const offset = (page - 1) * limit;

    const rows = await query(`SELECT * FROM payments ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    const cRows = await query(`SELECT count(*) FROM payments`);
    return {
      payments: rows.map((p) => ({ ...p, amount: toNum(p.amount) })),
      total: toNum(cRows[0].count),
    };
  },

  async getSalesReport() {
    const totalRow = await query(`SELECT COALESCE(SUM(total), 0) as revenue, count(*) as count FROM orders WHERE status = 'PAID'`);
    const itemsRow = await query(`SELECT COALESCE(SUM(quantity), 0) as items FROM order_items`);

    const rev = toNum(totalRow[0].revenue);
    const count = toNum(totalRow[0].count);

    return {
      summary: {
        totalSales: rev,
        successfulOrders: count,
        totalItemsSold: toNum(itemsRow[0].items),
        averageOrderValue: count > 0 ? Math.round(rev / count) : 0,
      },
      days: [],
    };
  },

  async getPaymentSettings() {
    const rows = await query(`SELECT * FROM payment_settings WHERE id = 'default'`);
    if (!rows.length) {
      return {
        id: 'default',
        mode: 'SANDBOX',
        activeProvider: 'zarinpal',
        minTopUpAmount: 10000,
        maxTopUpAmount: 50000000,
        zarinpalSandbox: true,
      };
    }
    return rows[0];
  },

  async updatePaymentSettings(data: any) {
    const allowed = ['mode', 'activeProvider', 'minTopUpAmount', 'maxTopUpAmount', 'zarinpalSandbox'];
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const k of allowed) {
      if (data[k] !== undefined) {
        fields.push(`"${k}" = $${idx++}`);
        values.push(data[k]);
      }
    }
    fields.push(`"updatedAt" = NOW()`);
    await query(`UPDATE payment_settings SET ${fields.join(', ')} WHERE id = 'default'`, values);
    return this.getPaymentSettings();
  },

  async testZarinpal() {
    try {
      const res = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          merchant_id: '00000000-0000-0000-0000-000000000000',
          amount: 50000,
          currency: 'IRT',
          description: 'تست اتصال درگاه زرین‌پال سندباکس رُکاد',
          callback_url: 'https://romenu.vercel.app/api/v1/payments/callback/zarinpal',
        }),
      });
      const data = await res.json();
      if (data.data && (data.data.code === 100 || data.data.code === 101)) {
        return { success: true, authority: data.data.authority, message: 'اتصال به زرین‌پال سندباکس برقرار است' };
      }
      return { success: false, message: `کد خطا زرین‌پال: ${data.errors?.code || 'نامشخص'}` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async getStoreSettings() {
    const rows = await query(`SELECT * FROM store_settings WHERE id = 'default'`);
    if (!rows.length) {
      return {
        id: 'default',
        storeName: 'بوفه رُکاد',
        activeTheme: 'neo-brutal',
        timezone: 'Asia/Tehran',
      };
    }
    return rows[0];
  },

  async updateStoreSettings(data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (data.storeName) {
      fields.push(`"storeName" = $${idx++}`);
      values.push(data.storeName);
    }
    if (data.activeTheme) {
      fields.push(`"activeTheme" = $${idx++}`);
      values.push(data.activeTheme);
    }
    fields.push(`"updatedAt" = NOW()`);
    await query(`UPDATE store_settings SET ${fields.join(', ')} WHERE id = 'default'`, values);
    return this.getStoreSettings();
  },

  async getAuditLogs() {
    return { logs: [], total: 0 };
  },
};
