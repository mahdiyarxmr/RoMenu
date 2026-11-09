import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('store_settings')
export class StoreSettings {
  @PrimaryColumn({ type: 'varchar', length: 50, default: 'default' })
  id: string;

  @Column({ type: 'varchar', length: 150, default: 'بوفه رُکاد' })
  storeName: string;

  @Column({ type: 'varchar', length: 50, default: 'neo-brutal' })
  activeTheme: string;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Tehran' })
  timezone: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
