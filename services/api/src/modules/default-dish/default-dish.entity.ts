import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Dish, MealType } from '../dish/dish.entity';
import { Store } from '../store/store.entity';

@Entity('default_dishes')
export class DefaultDish {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @ManyToOne(() => Store)
  store: Store;

  @Column({ type: 'varchar', default: MealType.LUNCH })
  mealType: MealType;

  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column()
  dishId: string;

  @ManyToOne(() => Dish)
  dish: Dish;

  @Column()
  dishName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
