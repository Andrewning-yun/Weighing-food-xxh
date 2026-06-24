import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @Column()
  operatedBy: string;

  @Column()
  operatedByName: string;

  @Column()
  module: string; // 'dish'|'ingredient'|'algorithm'|'menu_plan'|'inventory'|'task'|'user'|'store'

  @Column()
  action: string; // 'create'|'update'|'delete'|'publish'|'config_change'

  @Column()
  targetId: string;

  @Column({ nullable: true })
  targetName: string;

  @Column({ type: 'simple-json', nullable: true })
  before: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  after: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @CreateDateColumn()
  createdAt: Date;
}
