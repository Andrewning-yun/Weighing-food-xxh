import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Store } from '../store/store.entity';
import { User } from '../user/user.entity';
import { MealType } from '../dish/dish.entity';

export enum TaskSource {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface TaskItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @ManyToOne(() => Store)
  store: Store;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', default: MealType.LUNCH })
  mealType: MealType;

  @Column({ type: 'varchar', default: TaskSource.MANUAL })
  source: TaskSource;

  @Column()
  title: string;

  @Column('simple-json')
  items: TaskItem[];

  @Column({ nullable: true })
  assignedTo: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedTo' })
  assignee: User;

  @Column({ type: 'varchar', default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ nullable: true })
  completedBy: string;

  @Column({ type: 'date', nullable: true })
  completedAt: string;

  @CreateDateColumn()
  createdAt: Date;
}
