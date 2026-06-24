import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  chefCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  dailyCustomers?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  targetTicketPriceBreakfast?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  targetTicketPriceLunch?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerLiang?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  memberPricePerLiang?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ricePrice?: number;
}
