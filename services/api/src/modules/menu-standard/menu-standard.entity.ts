import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MealType } from '../dish/dish.entity';
import { Store } from '../store/store.entity';

@Entity('menu_standards')
export class MenuStandard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @ManyToOne(() => Store)
  store: Store;

  @Column({ type: 'varchar', default: MealType.LUNCH })
  mealType: MealType;

  @Column()
  category: string;

  @Column({ type: 'int' })
  targetCount: number;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
