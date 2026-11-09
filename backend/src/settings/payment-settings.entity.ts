import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_settings')
export class PaymentSettings {
  @PrimaryColumn({ type: 'varchar', length: 50, default: 'default' })
  id: string;

  @Column({ type: 'varchar', length: 20, default: 'SANDBOX' })
  mode: 'SANDBOX' | 'LIVE';

  @Column({ type: 'varchar', length: 50, default: 'sandbox' })
  activeProvider: string;

  @Column({ type: 'bigint', default: 10000 })
  minTopUpAmount: number;

  @Column({ type: 'bigint', default: 50000000 })
  maxTopUpAmount: number;

  @Column({ type: 'boolean', default: true })
  zarinpalSandbox: boolean;

  @Column({ type: 'text', nullable: true })
  credentialsEnc?: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
