import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  brandId: string;

  @Column({ default: 4 })
  chefCount: number;

  @Column({ default: 500 })
  dailyCustomers: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  targetTicketPriceBreakfast: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  targetTicketPriceLunch: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  pricePerLiang: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  memberPricePerLiang: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  ricePrice: number | null;

  @OneToMany(() => User, (user) => user.store)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
