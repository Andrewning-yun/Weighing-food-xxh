import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum DishCategory {
  // 正餐 (9类，对齐v1)
  STEAM = 'steam',
  PAN_FRY = 'panfry',
  DEEP_FRY = 'fry',
  CASSEROLE = 'casserole',
  STIR_FRY = 'stir',
  FRUIT = 'fruit',
  COLD = 'cold',
  SOUP = 'soup',
  TEA = 'tea',
  // 早餐 (3类)
  PORRIDGE = 'porridge',
  PASTRY = 'pastry',
  BREAKFAST_DRINK = 'breakfast_drink',
}

export enum Station {
  WOK = 'wok',
  GRILL_FRY_STEAM = 'grill_fry_steam',
  PREP = 'prep',
  BREAKFAST_WOK = 'breakfast_wok',
  BREAKFAST_ASSIST = 'breakfast_assist',
}

export enum MealType {
  LUNCH = 'lunch',
  BREAKFAST = 'breakfast',
}

export interface DishIngredientEmbeddable {
  ingredientId: string;
  quantity: number;
  unit: string;
  wasteRate: number;
}

export interface CookingStepEmbeddable {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  duration?: number;
  station?: string;
}

@Entity()
export class Dish {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  category: DishCategory;

  @Column({ type: 'varchar' })
  station: Station;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column('simple-json')
  ingredients: DishIngredientEmbeddable[];

  @Column('simple-json')
  steps: CookingStepEmbeddable[];

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  ingredientCost: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  recommendWeight: number;

  @Column({ type: 'varchar', default: MealType.LUNCH })
  mealType: MealType;

  @Column({ nullable: true })
  relatedIngredients: string;

  @Column({ nullable: true })
  dishTypeTag: string | null;

  @Column({ type: 'boolean', default: false })
  dishTypeTagManualOverride: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
