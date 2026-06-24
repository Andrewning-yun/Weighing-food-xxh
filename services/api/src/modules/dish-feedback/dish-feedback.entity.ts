import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Dish, MealType } from '../dish/dish.entity';
import { Store } from '../store/store.entity';
import { User } from '../user/user.entity';

export enum DishFeedbackLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('dish_feedback')
export class DishFeedback {
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

  @Column()
  dishId: string;

  @ManyToOne(() => Dish)
  dish: Dish;

  @Column()
  dishName: string;

  @Column({ type: 'varchar', default: DishFeedbackLevel.MEDIUM })
  feedbackLevel: DishFeedbackLevel;

  @Column({ type: 'int', nullable: true })
  remainingQty: number | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @Column({ nullable: true })
  reportedBy: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportedBy' })
  reporter: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
