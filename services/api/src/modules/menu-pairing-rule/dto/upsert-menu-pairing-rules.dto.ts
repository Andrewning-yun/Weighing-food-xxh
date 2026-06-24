import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MealType } from '../../dish/dish.entity';

export class MenuPairingRuleItemDto {
  @IsString()
  @IsOptional()
  tagCode?: string;

  @IsString()
  @IsOptional()
  tagName?: string;

  @IsInt()
  @Min(0)
  minCount: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxCount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpsertMenuPairingRulesDto {
  @IsString()
  storeId: string;

  @IsEnum(MealType)
  mealType: MealType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuPairingRuleItemDto)
  items: MenuPairingRuleItemDto[];
}
