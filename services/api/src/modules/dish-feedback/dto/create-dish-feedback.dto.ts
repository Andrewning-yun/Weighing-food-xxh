import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { MealType } from '../../dish/dish.entity';
import { DishFeedbackLevel } from '../dish-feedback.entity';

export class CreateDishFeedbackDto {
  @IsString()
  storeId: string;

  @IsDateString()
  date: string;

  @IsEnum(MealType)
  @IsOptional()
  mealType?: MealType;

  @IsString()
  dishId: string;

  @IsString()
  @IsOptional()
  dishName?: string;

  @IsEnum(DishFeedbackLevel)
  @IsOptional()
  feedbackLevel?: DishFeedbackLevel;

  @IsEnum(DishFeedbackLevel)
  @IsOptional()
  leftoverLevel?: DishFeedbackLevel;

  @IsInt()
  @Min(0)
  @IsOptional()
  remainingQty?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateDishFeedbackDto {
  @IsEnum(DishFeedbackLevel)
  @IsOptional()
  feedbackLevel?: DishFeedbackLevel;

  @IsEnum(DishFeedbackLevel)
  @IsOptional()
  leftoverLevel?: DishFeedbackLevel;

  @IsInt()
  @Min(0)
  @IsOptional()
  remainingQty?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
