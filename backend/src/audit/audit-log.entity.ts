import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  adminId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  adminName?: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  entity: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityId?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
