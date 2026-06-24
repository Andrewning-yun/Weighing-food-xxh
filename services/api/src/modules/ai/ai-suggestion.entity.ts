import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MealType } from '../dish/dish.entity';
import { Store } from '../store/store.entity';

export enum AiSuggestionStatus {
  DRAFT = 'draft',
  APPLIED = 'applied',
}

@Entity('ai_suggestions')
export class AiSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @ManyToOne(() => Store)
  store: Store;

  @Column({ type: 'varchar', default: MealType.LUNCH })
  mealType: MealType;

  @Column({ type: 'date' })
  date: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'manual' })
  source: string;

  @Column({ type: 'varchar', default: AiSuggestionStatus.DRAFT })
  status: AiSuggestionStatus;

  @Column({ type: 'datetime', nullable: true })
  appliedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
