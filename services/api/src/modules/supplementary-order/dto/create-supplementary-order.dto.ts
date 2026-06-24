import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupplementaryOrderDto {
  @IsString()
  @IsNotEmpty()
  menuPlanId: string;

  @IsString()
  @IsNotEmpty()
  dishId: string;

  @IsString()
  @IsNotEmpty()
  dishName: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  estimatedQuantity?: number;
}
