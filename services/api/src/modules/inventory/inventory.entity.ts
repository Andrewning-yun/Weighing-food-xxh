import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Store } from '../store/store.entity';
import { User } from '../user/user.entity';

export interface InventoryItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  perishable: boolean;
}

@Entity('daily_inventories')
export class DailyInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @ManyToOne(() => Store)
  store: Store;

  @Column({ type: 'date' })
  date: string;

  @Column('simple-json')
  items: InventoryItem[];

  @Column()
  reportedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportedBy' })
  reporter: User;

  @CreateDateColumn()
  createdAt: Date;
}
