import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { MealType } from '../../dish/dish.entity';

export class CreateAiSuggestionDto {
  @IsString()
  storeId: string;

  @IsEnum(MealType)
  @IsOptional()
  mealType?: MealType;

  @IsDateString()
  date: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  source?: string;
}
