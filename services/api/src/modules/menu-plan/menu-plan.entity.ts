import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../store/store.entity';
import { User } from '../user/user.entity';
import { MealType } from '../dish/dish.entity';

export enum MenuPlanStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface MenuPlanDish {
  dishId: string;
  quantity?: number;
  overrideQty?: number;
  isActive?: boolean;
}

@Entity('menu_plans')
export class MenuPlan {
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

  @Column('simple-json')
  dishes: MenuPlanDish[];

  @Column({ type: 'varchar', default: MenuPlanStatus.DRAFT })
  status: MenuPlanStatus;

  @Column()
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
