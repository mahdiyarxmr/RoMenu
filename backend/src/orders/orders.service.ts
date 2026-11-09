import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, LessThan } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { WalletsService } from '../wallets/wallets.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    private walletsService: WalletsService,
    private productsService: ProductsService,
    private dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    payload: {
      items: { productId: string; quantity: number }[];
      idempotencyKey?: string;
    },
  ): Promise<{ order: Order; paymentNeeded: boolean; paymentUrl?: string }> {
    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('سبد خرید نمی‌تواند خالی باشد');
    }

    // Idempotency check
    if (payload.idempotencyKey) {
      const existing = await this.ordersRepo.findOne({
        where: { idempotencyKey: payload.idempotencyKey },
        relations: ['items'],
      });
      if (existing) {
        return {
          order: existing,
          paymentNeeded: existing.status === 'PENDING_PAYMENT',
        };
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch products & compute line totals
      let subtotal = 0;
      const orderItemsToCreate: {
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
      }[] = [];

      for (const item of payload.items) {
        if (item.quantity <= 0 || item.quantity > 100) {
          throw new BadRequestException('تعداد هر محصول باید بین ۱ تا ۱۰۰ باشد');
        }

        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId, isDeleted: false, isActive: true },
        });

        if (!product) {
          throw new BadRequestException(`محصول با شناسه ${item.productId} معتبر نیست یا موجود نمی‌باشد`);
        }

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        orderItemsToCreate.push({
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        });
      }

      // 2. Fractional payment calculation
      const wallet = await this.walletsService.getWalletByUserId(userId);
      const walletBalance = Number(wallet.balance);
      const walletUsed = Math.min(walletBalance, subtotal);
      const paymentDue = subtotal - walletUsed;

      const order = queryRunner.manager.create(Order, {
        userId,
        subtotal,
        walletDeduction: walletUsed,
        gatewayAmount: paymentDue,
        total: subtotal,
        idempotencyKey: payload.idempotencyKey,
      });

      if (paymentDue === 0) {
        // Immediate completion with full wallet deduction
        order.status = 'COMPLETED';
        order.paidAt = new Date();
        order.completedAt = new Date();
        const savedOrder = await queryRunner.manager.save(order);

        // Save order items
        for (const oi of orderItemsToCreate) {
          const itemEntity = queryRunner.manager.create(OrderItem, {
            ...oi,
            orderId: savedOrder.id,
          });
          await queryRunner.manager.save(itemEntity);
        }

        // Deduct inventory directly
        await this.productsService.finalizeStockSale(
          payload.items,
          savedOrder.id,
          queryRunner.manager,
          false,
        );

        // Debit wallet
        await this.walletsService.debit({
          walletId: wallet.id,
          amount: walletUsed,
          type: 'DEBIT',
          referenceId: savedOrder.id,
          description: `تسویه سفارش بوفه شماره ${savedOrder.id.slice(0, 8)}`,
          idempotencyKey: `order-debit:${savedOrder.id}`,
        });

        await queryRunner.commitTransaction();

        savedOrder.items = await this.orderItemsRepo.find({ where: { orderId: savedOrder.id } });
        return { order: savedOrder, paymentNeeded: false };
      } else {
        // Gateway payment required: Reserve inventory & set 15-minute expiration
        order.status = 'PENDING_PAYMENT';
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        order.expiresAt = expiresAt;

        const savedOrder = await queryRunner.manager.save(order);

        for (const oi of orderItemsToCreate) {
          const itemEntity = queryRunner.manager.create(OrderItem, {
            ...oi,
            orderId: savedOrder.id,
          });
          await queryRunner.manager.save(itemEntity);
        }

        // Reserve stock
        await this.productsService.reserveStockForOrder(
          payload.items,
          savedOrder.id,
          queryRunner.manager,
        );

        await queryRunner.commitTransaction();

        savedOrder.items = await this.orderItemsRepo.find({ where: { orderId: savedOrder.id } });
        return {
          order: savedOrder,
          paymentNeeded: true,
        };
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMyOrders(userId: string, page = 1, limit = 30) {
    const [orders, total] = await this.ordersRepo.findAndCount({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { orders, total };
  }

  async getById(id: string, userId?: string, isAdmin = false): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['items', 'user'],
    });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    if (!isAdmin && userId && order.userId !== userId) {
      throw new ForbiddenException('شما دسترسی به این سفارش ندارید');
    }
    return order;
  }

  async cancel(orderId: string, userId: string, isAdmin = false): Promise<Order> {
    const order = await this.getById(orderId, userId, isAdmin);

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('فقط سفارش‌های در انتظار پرداخت قابل لغو هستند');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Release inventory
      await this.productsService.releaseStockForOrder(order.id, queryRunner.manager);

      order.status = 'CANCELLED';
      const saved = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async expireStaleOrders(): Promise<number> {
    const staleOrders = await this.ordersRepo.find({
      where: {
        status: 'PENDING_PAYMENT',
        expiresAt: LessThan(new Date()),
      },
    });

    let count = 0;
    for (const order of staleOrders) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await this.productsService.releaseStockForOrder(order.id, queryRunner.manager);
        order.status = 'EXPIRED';
        await queryRunner.manager.save(order);
        await queryRunner.commitTransaction();
        count++;
      } catch {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    }
    return count;
  }

  async findAll(params?: {
    status?: OrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 30;

    const qb = this.ordersRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.createdAt', 'DESC');

    if (params?.status) {
      qb.andWhere('order.status = :status', { status: params.status });
    }

    if (params?.search) {
      qb.andWhere('(user.name ILIKE :s OR user.mobile ILIKE :s OR order.id::text ILIKE :s)', {
        s: `%${params.search}%`,
      });
    }

    const [orders, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { orders, total };
  }
}
