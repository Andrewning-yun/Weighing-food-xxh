import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum AuditModuleName {
  DISH = 'dish',
  INGREDIENT = 'ingredient',
  MENU_PLAN = 'menu_plan',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
}

export enum AuditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity()
export class AuditRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @Column({ type: 'varchar' })
  module: AuditModuleName;

  @Column({ type: 'varchar' })
  action: AuditAction;

  @Column()
  targetId: string;

  @Column({ nullable: true })
  targetName: string;

  @Column()
  operatedBy: string;

  @Column()
  operatedByName: string;

  @Column('simple-json', { nullable: true })
  before: Record<string, unknown> | null;

  @Column('simple-json', { nullable: true })
  after: Record<string, unknown> | null;

  @Column({ type: 'varchar', default: AuditStatus.PENDING })
  status: AuditStatus;

  @Column({ nullable: true })
  reviewedBy: string | null;

  @Column({ nullable: true })
  reviewedByName: string | null;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date | null;

  @Column({ nullable: true })
  rejectReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
