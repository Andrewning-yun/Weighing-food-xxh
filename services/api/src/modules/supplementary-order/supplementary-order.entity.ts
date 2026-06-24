import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MealType } from '../dish/dish.entity';

@Entity('supplementary_order')
export class SupplementaryOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', default: MealType.LUNCH })
  mealType: MealType;

  @Column()
  menuPlanId: string;

  @Column()
  dishId: string;

  @Column()
  dishName: string;

  @Column()
  station: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'decimal', nullable: true })
  estimatedQuantity: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
