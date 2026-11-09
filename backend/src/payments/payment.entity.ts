import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  topUpId?: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'varchar', length: 20, default: 'SANDBOX' })
  mode: 'SANDBOX' | 'LIVE';

  @Column({ type: 'bigint' })
  amount: number;

  @Index()
  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  authorityOrToken?: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId?: string;

  @Index({ unique: true, where: '"idempotencyKey" IS NOT NULL' })
  @Column({ type: 'varchar', length: 150, nullable: true, unique: true })
  idempotencyKey?: string;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
