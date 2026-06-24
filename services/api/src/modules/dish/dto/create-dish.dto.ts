import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CookingStepEmbeddable, DishCategory, DishIngredientEmbeddable, MealType, Station } from '../dish.entity';

export class CreateDishDto {
  @IsString()
  name: string;

  @IsEnum(DishCategory)
  category: DishCategory;

  @IsEnum(Station)
  station: Station;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsArray()
  @ArrayMinSize(0)
  ingredients: DishIngredientEmbeddable[];

  @IsArray()
  @ArrayMinSize(0)
  steps: CookingStepEmbeddable[];

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
}
