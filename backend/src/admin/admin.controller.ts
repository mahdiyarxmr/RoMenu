import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import { DataSource } from 'typeorm';
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { Product } from '../products/product.entity';
import { OrderStatus } from '../orders/order.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'finance_admin')
@Controller('admin')
export class AdminController {
  constructor(
    private usersService: UsersService,
    private walletsService: WalletsService,
    private productsService: ProductsService,
    private ordersService: OrdersService,
    private paymentsService: PaymentsService,
    private settingsService: SettingsService,
    private auditService: AuditService,
    private dataSource: DataSource,
  ) {}

  // 1. Dashboard
  @Get('dashboard')
  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderRepo = this.dataSource.getRepository(Order);
    const paymentRepo = this.dataSource.getRepository(Payment);
    const productRepo = this.dataSource.getRepository(Product);

    // Sales today
    const salesTodayRes = await orderRepo
      .createQueryBuilder('o')
      .select('SUM(o.total)', 'total')
      .addSelect('COUNT(o.id)', 'count')
      .where('o.status = :st AND o.createdAt >= :today', { st: 'COMPLETED', today })
      .getRawOne();

    const todaySales = Number(salesTodayRes?.total || 0);
    const todayOrdersCount = Number(salesTodayRes?.count || 0);

    // Total users
    const totalUsers = await this.usersService.countAll();

    // Total wallet balances
    const totalWalletBalance = await this.walletsService.getTotalWalletBalances();

    // Active & sold-out products
    const activeProductsCount = await productRepo.count({ where: { isActive: true, isDeleted: false } });
    const soldOutProductsCount = await productRepo
      .createQueryBuilder('p')
      .where('p.isActive = true AND p.isDeleted = false AND p.trackInventory = true AND p.stock <= 0')
      .getCount();

    // 8 recent orders
    const recentOrders = await orderRepo.find({
      relations: ['user', 'items'],
      order: { createdAt: 'DESC' },
      take: 8,
    });

    // Recent failed payments
    const recentFailedPayments = await paymentRepo.find({
      where: { status: 'FAILED' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      kpis: {
        todaySales,
        todayOrdersCount,
        totalUsers,
        totalWalletBalance,
        activeProductsCount,
        soldOutProductsCount,
      },
      recentOrders,
      recentFailedPayments,
    };
  }

  // 2. Users & Wallets
  @Get('users')
  async getUsers(@Query('search') search?: string) {
    return this.usersService.findAll(search);
  }

  @Post('users/:id/wallet-adjustment')
  async adjustWallet(
    @Param('id') userId: string,
    @Body() body: { amount: number; type: 'CREDIT' | 'DEBIT'; reason: string },
    @CurrentUser('id') adminId: string,
    @CurrentUser('name') adminName: string,
  ) {
    return this.walletsService.adjust({
      userId,
      amount: Number(body.amount),
      type: body.type,
      reason: body.reason,
      adminId,
      adminName,
    });
  }

  @Patch('users/:id/active')
  async toggleUserActive(
    @Param('id') userId: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser('id') adminId: string,
    @CurrentUser('name') adminName: string,
  ) {
    const updated = await this.usersService.setActive(userId, isActive);
    await this.auditService.log({
      adminId,
      adminName,
      action: isActive ? 'ENABLE_USER' : 'DISABLE_USER',
      entity: 'User',
      entityId: userId,
      details: { isActive },
    });
    return updated;
  }

  // 3. Products & Stock
  @Get('products')
  async getProducts() {
    return this.productsService.findAll(false);
  }

  @Post('products')
  async createProduct(
    @Body() body: Partial<Product>,
    @CurrentUser('id') adminId: string,
    @CurrentUser('name') adminName: string,
  ) {
    const created = await this.productsService.create(body, adminId);
    await this.auditService.log({
      adminId,
      adminName,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: created.id,
      details: created,
    });
    return created;
  }

  @Patch('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() body: Partial<Product>,
    @CurrentUser('id') adminId: string,
    @CurrentUser('name') adminName: string,
  ) {
    const updated = await this.productsService.update(id, body);
    await this.auditService.log({
      adminId,
      adminName,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: id,
      details: body,
    });
    return updated;
  }

  @Delete('products/:id')
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @CurrentUser('name') adminName: string,
  ) {
    await this.productsService.delete(id);
    await this.auditService.log({
      adminId,
      adminName,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: id,
    });
    return { success: true };
  }

  @Post('products/:id/restock')
  async restockProduct(
    @Param('id') id: string,
    @Body() body: { quantityChange: number; reason: string; setExact?: boolean },
    @CurrentUser('id') adminId: string,
    @CurrentUser('name') adminName: string,
  ) {
    const updated = await this.productsService.restock(id, {
      ...body,
      adminId,
    });
    await this.auditService.log({
      adminId,
      adminName,
      action: body.setExact ? 'SET_PRODUCT_STOCK' : 'RESTOCK_PRODUCT',
      entity: 'Product',
      entityId: id,
      details: body,
    });
    return updated;
  }

  @Get('products/:id/movements')
  async getMovements(@Param('id') id: string) {
    return this.productsService.getMovements(id);
  }

  // 4. Orders
  @Get('orders')
  async getOrders(
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    return this.ordersService.findAll({
      status,
      search,
      page: Number(page),
      limit: Number(limit),
    });
  }

  // 5. Payments
  @Get('payments')
  async getPayments(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    return this.paymentsService.findAll({
      status,
      search,
      page: Number(page),
      limit: Number(limit),
    });
  }

  // 6. Sales Reports
  @Get('reports/sales')
  async getSalesReport(
    @Query('preset') preset = '30days',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const orderRepo = this.dataSource.getRepository(Order);
    let start = new Date();
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (preset === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (preset === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (preset === '7days') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (preset === 'thisMonth') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (preset === 'lastMonth') {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === 'all') {
      start = new Date('2020-01-01');
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // 30 days default
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    const orders = await orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.user', 'user')
      .where('o.status = :st AND o.createdAt >= :start AND o.createdAt <= :end', {
        st: 'COMPLETED',
        start,
        end,
      })
      .orderBy('o.createdAt', 'DESC')
      .getMany();

    const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const successfulOrders = orders.length;
    let totalItemsSold = 0;
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const o of orders) {
      for (const it of o.items) {
        totalItemsSold += it.quantity;
        if (!itemMap[it.productName]) {
          itemMap[it.productName] = { name: it.productName, quantity: 0, revenue: 0 };
        }
        itemMap[it.productName].quantity += it.quantity;
        itemMap[it.productName].revenue += Number(it.lineTotal);
      }
    }

    const averageOrderValue = successfulOrders > 0 ? Math.round(totalSales / successfulOrders) : 0;

    // Day-by-day grouping
    const dayMap: Record<string, Order[]> = {};
    for (const o of orders) {
      const dateKey = new Date(o.createdAt).toISOString().split('T')[0];
      if (!dayMap[dateKey]) dayMap[dateKey] = [];
      dayMap[dateKey].push(o);
    }

    const days = Object.entries(dayMap).map(([date, dayOrders]) => {
      const dailyTotal = dayOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const dayItemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
      for (const o of dayOrders) {
        for (const it of o.items) {
          if (!dayItemMap[it.productName]) {
            dayItemMap[it.productName] = { name: it.productName, quantity: 0, revenue: 0 };
          }
          dayItemMap[it.productName].quantity += it.quantity;
          dayItemMap[it.productName].revenue += Number(it.lineTotal);
        }
      }
      const topProducts = Object.values(dayItemMap)
        .map((p) => ({
          ...p,
          sharePercent: dailyTotal > 0 ? Math.round((p.revenue / dailyTotal) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        date,
        dailyTotal,
        ordersCount: dayOrders.length,
        topProducts,
        orders: dayOrders,
      };
    });

    return {
      summary: {
        totalSales,
        successfulOrders,
        totalItemsSold,
        averageOrderValue,
      },
      days,
    };
  }

  // 7. Settings
  @Get('settings/payment')
  async getPaymentSettings() {
    return this.settingsService.getPaymentSettings();
  }

  @Patch('settings/payment')
  async updatePaymentSettings(
    @Body() body: any,
    @CurrentUser('id') adminId: string,
    @CurrentUser('name') adminName: string,
  ) {
    return this.settingsService.updatePaymentSettings(body, adminId, adminName);
  }

  @Post('settings/payment/credentials/:provider')
  async saveCredentials(
    @Param('provider') provider: string,
    @Body() keys: Record<string, string>,
    @CurrentUser('id') adminId: string,
    @CurrentUser('name') adminName: string,
  ) {
    return this.settingsService.saveCredentials(provider, keys, adminId, adminName);
  }

  @Post('settings/payment/test-zarinpal')
  async testZarinpal() {
    try {
      const res = await fetch('https://sandbox.zarinpal.com/pg/v4/payment/request.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          merchant_id: '00000000-0000-0000-0000-000000000000',
          amount: 10000,
          currency: 'IRT',
          callback_url: 'http://localhost:3002/api/v1/payments/callback/zarinpal',
          description: 'تست اتصال درگاه زرین‌پال',
        }),
        signal: AbortSignal.timeout(6000),
      });
      const data = await res.json();
      if (data?.data?.code === 100) {
        return {
          success: true,
          message: 'ارتباط مستقیم با وب‌سرویس زرین‌پال با موفقیت برقرار است',
          authority: data.data.authority,
        };
      }
      return {
        success: false,
        message: data?.errors?.message || 'پاسخ ناموفق از سرور زرین‌پال',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'خطا در شبکه هنگام اتصال به زرین‌پال: ' + err.message,
      };
    }
  }

  @Get('settings/store')
  async getStoreSettings() {
    return this.settingsService.getStoreSettings();
  }

  @Patch('settings/store')
  async updateStoreSettings(
    @Body() body: any,
    @CurrentUser('id') adminId: string,
    @CurrentUser('name') adminName: string,
  ) {
    return this.settingsService.updateStoreSettings(body, adminId, adminName);
  }

  // 8. Audit Logs
  @Get('audit-logs')
  async getAuditLogs(
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    return this.auditService.findAll({ search, page: Number(page), limit: Number(limit) });
  }
}
