import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../store/store.entity';

export enum UserRole {
  ADMIN = 'admin',
  CHEF_MANAGER = 'chef_manager',
  CHEF = 'chef',
  PREP = 'prep',
  BREAKFAST_CHEF = 'breakfast_chef',
  BREAKFAST_ASSISTANT = 'breakfast_assistant',
  BUYER = 'buyer',
  STORE_MANAGER = 'store_manager',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: UserRole.CHEF,
  })
  role: UserRole;

  @ManyToOne(() => Store, (store) => store.users)
  store: Store;

  @Column({ nullable: true })
  storeId: string;

  @Column({ nullable: true })
  wechatOpenId: string;

  @Column({ type: 'varchar', nullable: true })
  station: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
