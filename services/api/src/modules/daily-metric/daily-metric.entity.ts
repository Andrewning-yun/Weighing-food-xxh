import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MealType } from '../dish/dish.entity';
import { Store } from '../store/store.entity';
import { User } from '../user/user.entity';

@Entity('daily_metrics')
export class DailyMetric {
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

  @Column('decimal', { precision: 10, scale: 2 })
  ticketPrice: number;

  @Column({ type: 'int' })
  guestCount: number;

  @Column({ nullable: true })
  weather: string | null;

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
