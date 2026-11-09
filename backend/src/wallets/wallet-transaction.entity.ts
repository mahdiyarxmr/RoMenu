import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export type WalletTransactionType =
  | 'CREDIT'
  | 'DEBIT'
  | 'RESERVE'
  | 'RELEASE'
  | 'REFUND'
  | 'ADJUSTMENT';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  walletId: string;

  @ManyToOne(() => Wallet, (w) => w.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({ type: 'varchar', length: 20 })
  type: WalletTransactionType;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'bigint' })
  balanceBefore: number;

  @Column({ type: 'bigint' })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Index({ unique: true, where: '"idempotencyKey" IS NOT NULL' })
  @Column({ type: 'varchar', length: 150, nullable: true, unique: true })
  idempotencyKey?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
