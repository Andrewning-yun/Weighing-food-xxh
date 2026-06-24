import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MealType } from '../dish/dish.entity';
import { Store } from '../store/store.entity';

@Entity('menu_pairing_rules')
export class MenuPairingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @ManyToOne(() => Store)
  store: Store;

  @Column({ type: 'varchar', default: MealType.LUNCH })
  mealType: MealType;

  @Column()
  tagCode: string;

  @Column({ type: 'int', default: 0 })
  minCount: number;

  @Column({ type: 'int', default: 0 })
  maxCount: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
