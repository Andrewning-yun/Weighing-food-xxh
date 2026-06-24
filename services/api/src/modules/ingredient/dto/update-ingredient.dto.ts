import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateIngredientDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  spec?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
