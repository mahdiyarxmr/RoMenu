import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/server/db';
import {
  productService,
  authService,
  walletService,
  orderService,
  paymentService,
  adminService,
} from '@/lib/server/services';

function getOrigin(req: NextRequest): string {
  const host = req.headers.get('host') || 'localhost:3002';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  const searchParams = req.nextUrl.searchParams;
  const user = getAuthUser(req);
  const origin = getOrigin(req);

  try {
    // 1. Products
    if (slug[0] === 'products') {
      if (slug.length === 1) {
        const products = await productService.getAll();
        return NextResponse.json(products);
      }
      if (slug.length === 2) {
        const product = await productService.getById(slug[1]);
        if (!product) return NextResponse.json({ message: 'محصول یافت نشد' }, { status: 404 });
        return NextResponse.json(product);
      }
    }

    // 2. Auth
    if (slug[0] === 'auth' && slug[1] === 'me') {
      if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      const me = await authService.getMe(user.id);
      return NextResponse.json(me);
    }

    // 3. Wallet
    if (slug[0] === 'wallet') {
      if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      if (slug.length === 1) {
        const wallet = await walletService.getWallet(user.id);
        return NextResponse.json(wallet);
      }
      if (slug[1] === 'transactions') {
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 20;
        const res = await walletService.getTransactions(user.id, page, limit);
        return NextResponse.json(res);
      }
      if (slug[1] === 'top-ups' && slug[3] === 'status') {
        const status = await walletService.getTopUpStatus(slug[2]);
        return NextResponse.json(status);
      }
    }

    // 4. Orders
    if (slug[0] === 'orders') {
      if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      if (slug.length === 1) {
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 30;
        const res = await orderService.getAll(user.id, page, limit);
        return NextResponse.json(res);
      }
      if (slug.length === 2) {
        const order = await orderService.getById(slug[1], user.id);
        return NextResponse.json(order);
      }
    }

    // 5. Payments
    if (slug[0] === 'payments') {
      if (slug[1] === 'mine' && slug[2]) {
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        const res = await paymentService.getMinePayment(slug[2], user.id);
        return NextResponse.json(res);
      }
      if (slug[1] === 'callback' && slug[2]) {
        const provider = slug[2];
        const authority = searchParams.get('Authority') || searchParams.get('authority');
        const status = searchParams.get('Status') || searchParams.get('status');
        const paymentId = searchParams.get('paymentId');
        const redirectUrl = await paymentService.handleCallback(provider, authority, status, paymentId, origin);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // 6. Store
    if (slug[0] === 'store') {
      if (slug.length === 1) {
        const settings = await adminService.getStoreSettings();
        return NextResponse.json(settings);
      }
      if (slug[1] === 'theme') {
        const settings = await adminService.getStoreSettings();
        return NextResponse.json({ theme: settings.activeTheme || 'neo-brutal' });
      }
    }

    // 7. Admin
    if (slug[0] === 'admin') {
      if (slug[1] === 'dashboard') {
        const res = await adminService.getDashboard();
        return NextResponse.json(res);
      }
      if (slug[1] === 'products') {
        if (slug.length === 2) {
          const res = await productService.adminGetAll();
          return NextResponse.json(res);
        }
        if (slug[3] === 'movements') {
          const res = await productService.getMovements(slug[2]);
          return NextResponse.json(res);
        }
      }
      if (slug[1] === 'users') {
        const res = await adminService.getUsers(searchParams.get('search') || undefined);
        return NextResponse.json(res);
      }
      if (slug[1] === 'orders') {
        const res = await adminService.getOrders({
          status: searchParams.get('status') || undefined,
          search: searchParams.get('search') || undefined,
          page: Number(searchParams.get('page')) || 1,
          limit: Number(searchParams.get('limit')) || 30,
        });
        return NextResponse.json(res);
      }
      if (slug[1] === 'payments') {
        const res = await adminService.getPayments({
          status: searchParams.get('status') || undefined,
          page: Number(searchParams.get('page')) || 1,
          limit: Number(searchParams.get('limit')) || 30,
        });
        return NextResponse.json(res);
      }
      if (slug[1] === 'reports' && slug[2] === 'sales') {
        const res = await adminService.getSalesReport();
        return NextResponse.json(res);
      }
      if (slug[1] === 'settings') {
        if (slug[2] === 'payment') {
          const res = await adminService.getPaymentSettings();
          return NextResponse.json(res);
        }
        if (slug[2] === 'store') {
          const res = await adminService.getStoreSettings();
          return NextResponse.json(res);
        }
      }
      if (slug[1] === 'audit-logs') {
        const res = await adminService.getAuditLogs();
        return NextResponse.json(res);
      }
    }

    return NextResponse.json({ message: `Route not found: ${slug.join('/')}` }, { status: 404 });
  } catch (err: any) {
    console.error('API GET Error:', err);
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  const user = getAuthUser(req);
  const origin = getOrigin(req);

  try {
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json().catch(() => ({}));
    }

    // 1. Auth
    if (slug[0] === 'auth') {
      if (slug[1] === 'login') {
        const res = await authService.login(body.mobile, body.password);
        return NextResponse.json(res);
      }
      if (slug[1] === 'register') {
        const res = await authService.register(body.name, body.mobile, body.password);
        return NextResponse.json(res);
      }
    }

    // 2. Wallet
    if (slug[0] === 'wallet' && slug[1] === 'top-ups') {
      if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      const res = await walletService.startTopUp(user.id, Number(body.amount), origin);
      return NextResponse.json(res);
    }

    // 3. Orders
    if (slug[0] === 'orders') {
      if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      if (slug.length === 1) {
        const res = await orderService.create(user.id, body.items, origin);
        return NextResponse.json(res);
      }
      if (slug.length === 3 && slug[2] === 'cancel') {
        const res = await orderService.cancel(slug[1], user.id);
        return NextResponse.json(res);
      }
    }

    // 4. Payments
    if (slug[0] === 'payments') {
      if (slug[1] === 'sandbox' && slug[2] === 'action') {
        const redirectUrl = await paymentService.sandboxAction(body.paymentId, body.action, origin);
        return NextResponse.json({ redirectUrl });
      }
      if (slug[1] === 'orders' && slug[2] === 'start') {
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        const startRes = await orderService.startOrderPayment(body.orderId, user.id, origin);
        return NextResponse.json(startRes);
      }
      if (slug[1] === 'callback' && slug[2]) {
        const provider = slug[2];
        const searchParams = req.nextUrl.searchParams;
        const authority = searchParams.get('Authority') || body.Authority;
        const status = searchParams.get('Status') || body.Status;
        const paymentId = searchParams.get('paymentId') || body.paymentId;
        const redirectUrl = await paymentService.handleCallback(provider, authority, status, paymentId, origin);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // 5. Admin
    if (slug[0] === 'admin') {
      if (slug[1] === 'products') {
        if (slug.length === 2) {
          const res = await productService.adminCreate(body);
          return NextResponse.json(res);
        }
        if (slug[3] === 'restock') {
          const res = await productService.adminRestock(
            slug[2],
            Number(body.quantityChange),
            body.reason,
            user?.id,
            body.setExact
          );
          return NextResponse.json(res);
        }
      }
      if (slug[1] === 'users' && slug[3] === 'wallet-adjustment') {
        const res = await adminService.adjustWallet(slug[2], Number(body.amount), body.type, body.reason);
        return NextResponse.json(res);
      }
      if (slug[1] === 'settings' && slug[2] === 'payment') {
        if (slug[3] === 'test-zarinpal') {
          const res = await adminService.testZarinpal();
          return NextResponse.json(res);
        }
        if (slug[3] === 'credentials') {
          return NextResponse.json({ success: true });
        }
      }
    }

    return NextResponse.json({ message: `Route not found: POST ${slug.join('/')}` }, { status: 404 });
  } catch (err: any) {
    console.error('API POST Error:', err);
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  try {
    const body = await req.json().catch(() => ({}));
    if (slug[0] === 'admin') {
      if (slug[1] === 'products' && slug.length === 3) {
        const res = await productService.adminUpdate(slug[2], body);
        return NextResponse.json(res);
      }
      if (slug[1] === 'users' && slug[3] === 'active') {
        const res = await adminService.toggleUserActive(slug[2], body.isActive);
        return NextResponse.json(res);
      }
      if (slug[1] === 'settings') {
        if (slug[2] === 'payment') {
          const res = await adminService.updatePaymentSettings(body);
          return NextResponse.json(res);
        }
        if (slug[2] === 'store') {
          const res = await adminService.updateStoreSettings(body);
          return NextResponse.json(res);
        }
      }
    }
    return NextResponse.json({ message: `Route not found: PATCH ${slug.join('/')}` }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  try {
    if (slug[0] === 'admin' && slug[1] === 'products' && slug.length === 3) {
      const res = await productService.adminDelete(slug[2]);
      return NextResponse.json(res);
    }
    return NextResponse.json({ message: `Route not found: DELETE ${slug.join('/')}` }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 400 });
  }
}
