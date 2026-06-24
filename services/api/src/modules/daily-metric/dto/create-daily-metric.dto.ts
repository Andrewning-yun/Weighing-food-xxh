import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MealType } from '../../dish/dish.entity';

export class CreateDailyMetricDto {
  @IsString()
  storeId: string;

  @IsDateString()
  date: string;

  @IsEnum(MealType)
  @IsOptional()
  mealType?: MealType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ticketPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  avgTicketPrice?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  guestCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  customerCount?: number;

  @IsString()
  @IsOptional()
  weather?: string;
}

export class UpdateDailyMetricDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsEnum(MealType)
  @IsOptional()
  mealType?: MealType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ticketPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  avgTicketPrice?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  guestCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  customerCount?: number;

  @IsString()
  @IsOptional()
  weather?: string;
}
