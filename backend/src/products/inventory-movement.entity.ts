import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type MovementType =
  | 'INITIAL'
  | 'RESTOCK'
  | 'ADJUSTMENT'
  | 'RESERVE'
  | 'RELEASE'
  | 'SALE';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 20 })
  type: MovementType;

  @Column({ type: 'int' })
  quantityChange: number;

  @Column({ type: 'int' })
  stockBefore: number;

  @Column({ type: 'int' })
  stockAfter: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @Column({ type: 'uuid', nullable: true })
  adminId?: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
