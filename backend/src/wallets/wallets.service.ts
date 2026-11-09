import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import { WalletTransaction, WalletTransactionType } from './wallet-transaction.entity';
import { WalletTopUp } from './wallet-topup.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletsRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private transactionsRepo: Repository<WalletTransaction>,
    @InjectRepository(WalletTopUp)
    private topUpsRepo: Repository<WalletTopUp>,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async getWalletByUserId(userId: string): Promise<Wallet> {
    let wallet = await this.walletsRepo.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletsRepo.create({ userId, balance: 0 });
      await this.walletsRepo.save(wallet);
    }
    return wallet;
  }

  async credit(params: {
    walletId: string;
    amount: number;
    type: WalletTransactionType;
    referenceId?: string;
    description?: string;
    idempotencyKey?: string;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    if (params.amount <= 0) {
      throw new BadRequestException('مبلغ باید بزرگ‌تر از صفر باشد');
    }

    // Check idempotency
    if (params.idempotencyKey) {
      const existingTx = await this.transactionsRepo.findOne({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existingTx) {
        const wallet = await this.walletsRepo.findOneOrFail({ where: { id: params.walletId } });
        return { wallet, transaction: existingTx };
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: params.walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) throw new NotFoundException('کیف پول یافت نشد');

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + Number(params.amount);

      wallet.balance = balanceAfter;
      await queryRunner.manager.save(wallet);

      const tx = queryRunner.manager.create(WalletTransaction, {
        walletId: wallet.id,
        type: params.type,
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        referenceId: params.referenceId,
        description: params.description,
        idempotencyKey: params.idempotencyKey,
      });

      const savedTx = await queryRunner.manager.save(tx);
      await queryRunner.commitTransaction();

      return { wallet, transaction: savedTx };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async debit(params: {
    walletId: string;
    amount: number;
    type: WalletTransactionType;
    referenceId?: string;
    description?: string;
    idempotencyKey?: string;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    if (params.amount <= 0) {
      throw new BadRequestException('مبلغ باید بزرگ‌تر از صفر باشد');
    }

    if (params.idempotencyKey) {
      const existingTx = await this.transactionsRepo.findOne({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existingTx) {
        const wallet = await this.walletsRepo.findOneOrFail({ where: { id: params.walletId } });
        return { wallet, transaction: existingTx };
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: params.walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) throw new NotFoundException('کیف پول یافت نشد');

      const balanceBefore = Number(wallet.balance);
      if (balanceBefore < params.amount) {
        throw new BadRequestException('موجودی کیف پول کافی نیست');
      }

      const balanceAfter = balanceBefore - Number(params.amount);
      wallet.balance = balanceAfter;
      await queryRunner.manager.save(wallet);

      const tx = queryRunner.manager.create(WalletTransaction, {
        walletId: wallet.id,
        type: params.type,
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        referenceId: params.referenceId,
        description: params.description,
        idempotencyKey: params.idempotencyKey,
      });

      const savedTx = await queryRunner.manager.save(tx);
      await queryRunner.commitTransaction();

      return { wallet, transaction: savedTx };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async adjust(params: {
    userId: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    reason: string;
    adminId: string;
    adminName?: string;
  }) {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new BadRequestException('ثبت دلیل برای تغییر دستی موجودی اجباری است');
    }

    const wallet = await this.getWalletByUserId(params.userId);

    const result =
      params.type === 'CREDIT'
        ? await this.credit({
            walletId: wallet.id,
            amount: params.amount,
            type: 'ADJUSTMENT',
            description: `تنظیم دستی توسط ادمین: ${params.reason}`,
          })
        : await this.debit({
            walletId: wallet.id,
            amount: params.amount,
            type: 'ADJUSTMENT',
            description: `تنظیم دستی توسط ادمین: ${params.reason}`,
          });

    await this.auditService.log({
      adminId: params.adminId,
      adminName: params.adminName,
      action: `WALLET_ADJUSTMENT_${params.type}`,
      entity: 'Wallet',
      entityId: wallet.id,
      details: {
        userId: params.userId,
        amount: params.amount,
        type: params.type,
        reason: params.reason,
        balanceBefore: result.transaction.balanceBefore,
        balanceAfter: result.transaction.balanceAfter,
      },
    });

    return result;
  }

  async getTransactions(walletId: string, page = 1, limit = 20) {
    const [transactions, total] = await this.transactionsRepo.findAndCount({
      where: { walletId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { transactions, total };
  }

  async createTopUp(userId: string, amount: number) {
    const topUp = this.topUpsRepo.create({
      userId,
      amount,
      status: 'PENDING',
    });
    return this.topUpsRepo.save(topUp);
  }

  async completeTopUp(topUpId: string, paymentId: string) {
    const topUp = await this.topUpsRepo.findOne({ where: { id: topUpId } });
    if (!topUp) throw new NotFoundException('درخواست شارژ یافت نشد');
    if (topUp.status === 'SUCCEEDED') return topUp;

    const wallet = await this.getWalletByUserId(topUp.userId);

    await this.credit({
      walletId: wallet.id,
      amount: Number(topUp.amount),
      type: 'CREDIT',
      referenceId: paymentId,
      description: 'شارژ آنلاین کیف پول',
      idempotencyKey: `topup-credit:${paymentId}`,
    });

    topUp.status = 'SUCCEEDED';
    topUp.paymentId = paymentId;
    return this.topUpsRepo.save(topUp);
  }

  async getTotalWalletBalances(): Promise<number> {
    const result = await this.walletsRepo
      .createQueryBuilder('w')
      .select('SUM(w.balance)', 'total')
      .getRawOne();
    return Number(result?.total || 0);
  }
}
