import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MealType } from '../../dish/dish.entity';

export class DefaultDishItemDto {
  @IsString()
  dishId: string;

  /** dishName 可选，不传时由 Service 自动从 dishId 查询回填 */
  dishName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpsertDefaultDishesDto {
  @IsString()
  storeId: string;

  @IsEnum(MealType)
  mealType: MealType;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefaultDishItemDto)
  items: DefaultDishItemDto[];
}
