import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MealType } from '../../dish/dish.entity';
import { MenuPlanStatus } from '../menu-plan.entity';

export class MenuPlanDishDto {
  @IsString()
  dishId: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  overrideQty?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateMenuPlanDto {
  @IsString()
  storeId: string;

  @IsDateString()
  date: string;

  @IsEnum(MealType)
  mealType: MealType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuPlanDishDto)
  dishes: MenuPlanDishDto[];
}

export class UpdateMenuPlanDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuPlanDishDto)
  dishes?: MenuPlanDishDto[];

  @IsOptional()
  @IsEnum(MenuPlanStatus)
  status?: MenuPlanStatus;
}
