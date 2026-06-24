import { Column, CreateDateColumn, Entity, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dish_type_tags')
export class DishTypeTagRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('simple-json', { default: '[]' })
  keywords: string[];

  @Column('simple-json', { default: '[]' })
  categoryHints: string[];

  @Column('simple-json', { default: '[]' })
  mealTypeHints: string[];

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export { DishTypeTagRule as DishTypeTag };
