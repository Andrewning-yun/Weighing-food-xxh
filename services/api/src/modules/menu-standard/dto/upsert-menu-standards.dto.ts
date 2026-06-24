import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MealType } from '../../dish/dish.entity';

export class MenuStandardItemDto {
  @IsString()
  category: string;

  @IsInt()
  @Min(0)
  targetCount: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpsertMenuStandardsDto {
  @IsString()
  storeId: string;

  @IsEnum(MealType)
  mealType: MealType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuStandardItemDto)
  items: MenuStandardItemDto[];
}
