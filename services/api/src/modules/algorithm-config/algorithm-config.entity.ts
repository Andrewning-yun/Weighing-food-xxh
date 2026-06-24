import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../store/store.entity';

@Entity('algorithm_config')
export class AlgorithmConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @ManyToOne(() => Store)
  store: Store;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  ticketPriceBonusWeight: number;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  pairingBonusWeight: number;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  feedbackBonusWeight: number;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  diversityBonusWeight: number;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  categoryBonusWeight: number;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  menuCompletenessWeight: number;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  menuFreshnessWeight: number;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  menuGrossMarginWeight: number;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  defaultDishPenalty: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0.1 })
  ticketPriceThreshold: number;

  @Column('decimal', { precision: 10, scale: 2, default: 3 })
  ticketPriceCapMultiplier: number;

  @Column({ type: 'int', default: 7 })
  recentDaysWindow: number;

  @Column({ type: 'int', default: 20 })
  recommendLimit: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
