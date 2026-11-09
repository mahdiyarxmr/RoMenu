import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('wallet_topups')
export class WalletTopUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';

  @Column({ type: 'uuid', nullable: true })
  paymentId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
