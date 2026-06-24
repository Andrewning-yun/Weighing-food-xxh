import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CookingStepEmbeddable, DishCategory, DishIngredientEmbeddable, MealType, Station } from '../dish.entity';

export class UpdateDishDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(DishCategory)
  @IsOptional()
  category?: DishCategory;

  @IsEnum(Station)
  @IsOptional()
  station?: Station;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsArray()
  @IsOptional()
  ingredients?: DishIngredientEmbeddable[];

  @IsArray()
  @IsOptional()
  steps?: CookingStepEmbeddable[];

  @IsEnum(MealType)
  @IsOptional()
  mealType?: MealType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  recommendWeight?: number;

  @IsString()
  @IsOptional()
  relatedIngredients?: string;

  @IsString()
  @IsOptional()
  dishTypeTag?: string;

  @IsBoolean()
  @IsOptional()
  dishTypeTagManualOverride?: boolean;
}
