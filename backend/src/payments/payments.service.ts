import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { Order } from '../orders/order.entity';
import { WalletTopUp } from '../wallets/wallet-topup.entity';
import { PaymentSettings } from '../settings/payment-settings.entity';
import { SandboxProvider } from './providers/sandbox.provider';
import { ZarinpalProvider } from './providers/zarinpal.provider';
import { PaymentProvider } from './providers/payment-provider.interface';
import { decryptCredentials } from './crypto.helper';
import { WalletsService } from '../wallets/wallets.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(WalletTopUp)
    private topUpsRepo: Repository<WalletTopUp>,
    @InjectRepository(PaymentSettings)
    private settingsRepo: Repository<PaymentSettings>,
    private sandboxProvider: SandboxProvider,
    private zarinpalProvider: ZarinpalProvider,
    private walletsService: WalletsService,
    private productsService: ProductsService,
    private dataSource: DataSource,
  ) {}

  private getProviderInstance(providerName: string): PaymentProvider {
    switch (providerName.toLowerCase()) {
      case 'zarinpal':
        return this.zarinpalProvider;
      case 'sandbox':
      default:
        return this.sandboxProvider;
    }
  }

  async startOrderPayment(orderId: string, userId: string) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'items'],
    });

    if (!order) throw new NotFoundException('سفارش یافت نشد');
    if (order.userId !== userId) throw new ForbiddenException('دسترسی مجاز نیست');

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('این سفارش نیازمند پرداخت درگاه نیست');
    }

    if (order.expiresAt && new Date(order.expiresAt) < new Date()) {
      throw new BadRequestException('مهلت پرداخت این سفارش منقضی شده است');
    }

    const settings = await this.settingsRepo.findOne({ where: { id: 'default' } });
    const providerName = settings?.activeProvider || 'sandbox';
    const mode = settings?.mode || 'SANDBOX';
    const creds = settings?.credentialsEnc ? decryptCredentials(settings.credentialsEnc) : {};

    const payment = this.paymentsRepo.create({
      userId,
      orderId: order.id,
      amount: order.gatewayAmount,
      provider: providerName,
      mode,
      status: 'PENDING',
    });
    const savedPayment = await this.paymentsRepo.save(payment);

    const provider = this.getProviderInstance(providerName);
    const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
    const callbackUrl = `${backendUrl}/api/v1/payments/callback/${providerName}?paymentId=${savedPayment.id}`;

    const paymentResult = await provider.createPayment({
      paymentId: savedPayment.id,
      amount: savedPayment.amount,
      description: `پرداخت سفارش بوفه رُکاد شماره ${order.id.slice(0, 8)}`,
      callbackUrl,
      userMobile: order.user?.mobile,
      userName: order.user?.name,
      credentials: creds[providerName],
      isSandbox: settings?.zarinpalSandbox ?? true,
    });

    savedPayment.authorityOrToken = paymentResult.authorityOrToken;
    await this.paymentsRepo.save(savedPayment);

    order.paymentProvider = providerName;
    await this.ordersRepo.save(order);

    return {
      paymentId: savedPayment.id,
      redirectUrl: paymentResult.redirectUrl,
      provider: providerName,
    };
  }

  async verifyPayment(paymentId: string, queryParams: Record<string, any> = {}) {
    const payment = await this.paymentsRepo.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });

    if (!payment) throw new NotFoundException('پرداخت یافت نشد');

    // Idempotency: if already processed, return current result
    if (payment.status === 'SUCCESS') {
      return {
        success: true,
        referenceId: payment.referenceId,
        message: 'تراکنش قبلاً با موفقیت تایید شده است',
      };
    }

    const settings = await this.settingsRepo.findOne({ where: { id: 'default' } });
    const creds = settings?.credentialsEnc ? decryptCredentials(settings.credentialsEnc) : {};
    const provider = this.getProviderInstance(payment.provider);

    const verifyResult = await provider.verify({
      paymentId: payment.id,
      amount: payment.amount,
      authorityOrToken: payment.authorityOrToken,
      queryParams,
      credentials: creds[payment.provider],
      isSandbox: settings?.zarinpalSandbox ?? true,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (verifyResult.success) {
        payment.status = 'SUCCESS';
        payment.referenceId = verifyResult.referenceId;
        payment.verifiedAt = new Date();
        await queryRunner.manager.save(payment);

        if (payment.orderId) {
          const order = await queryRunner.manager.findOne(Order, {
            where: { id: payment.orderId },
            relations: ['items'],
          });
          if (order && order.status === 'PENDING_PAYMENT') {
            order.status = 'COMPLETED';
            order.paidAt = new Date();
            order.completedAt = new Date();
            await queryRunner.manager.save(order);

            // Deduct wallet deduction portion if any
            if (Number(order.walletDeduction) > 0) {
              const wallet = await this.walletsService.getWalletByUserId(order.userId);
              await this.walletsService.debit({
                walletId: wallet.id,
                amount: Number(order.walletDeduction),
                type: 'DEBIT',
                referenceId: order.id,
                description: `تسویه بخش کیف پول سفارش ${order.id.slice(0, 8)}`,
                idempotencyKey: `order-partial-debit:${order.id}`,
              });
            }

            // Finalize stock sale
            await this.productsService.finalizeStockSale(
              order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
              order.id,
              queryRunner.manager,
              true,
            );
          }
        } else if (payment.topUpId) {
          await this.walletsService.completeTopUp(payment.topUpId, payment.id);
        }

        await queryRunner.commitTransaction();
        return {
          success: true,
          referenceId: payment.referenceId,
          message: verifyResult.message || 'پرداخت با موفقیت تایید شد',
        };
      } else {
        payment.status = 'FAILED';
        await queryRunner.manager.save(payment);

        if (payment.orderId) {
          const order = await queryRunner.manager.findOne(Order, {
            where: { id: payment.orderId },
          });
          if (order && order.status === 'PENDING_PAYMENT') {
            order.status = 'PAYMENT_FAILED';
            await queryRunner.manager.save(order);
            // Release reserved stock
            await this.productsService.releaseStockForOrder(order.id, queryRunner.manager);
          }
        } else if (payment.topUpId) {
          const topUp = await queryRunner.manager.findOne(WalletTopUp, {
            where: { id: payment.topUpId },
          });
          if (topUp) {
            topUp.status = 'FAILED';
            await queryRunner.manager.save(topUp);
          }
        }

        await queryRunner.commitTransaction();
        return {
          success: false,
          message: verifyResult.message || 'پرداخت ناموفق بود',
        };
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByAuthority(authority: string) {
    return this.paymentsRepo.findOne({
      where: { authorityOrToken: authority },
      relations: ['user'],
    });
  }

  async getMinePayment(paymentId: string, userId: string) {
    const payment = await this.paymentsRepo.findOne({
      where: { id: paymentId, userId },
    });
    if (!payment) throw new NotFoundException('پرداخت یافت نشد');

    let order: Order | null = null;
    if (payment.orderId) {
      order = await this.ordersRepo.findOne({
        where: { id: payment.orderId },
        relations: ['items'],
      });
    }

    return { payment, order };
  }

  async findAll(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 30;

    const qb = this.paymentsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .orderBy('p.createdAt', 'DESC');

    if (params?.status) {
      qb.andWhere('p.status = :s', { s: params.status });
    }

    if (params?.search) {
      qb.andWhere(
        '(p.referenceId ILIKE :s OR p.authorityOrToken ILIKE :s OR user.name ILIKE :s OR user.mobile ILIKE :s)',
        { s: `%${params.search}%` },
      );
    }

    const [payments, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { payments, total };
  }
}
