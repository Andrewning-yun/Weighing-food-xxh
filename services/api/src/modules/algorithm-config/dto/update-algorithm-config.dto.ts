import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAlgorithmConfigDto {
  @IsString()
  storeId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ticketPriceBonusWeight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pairingBonusWeight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  feedbackBonusWeight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  diversityBonusWeight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  categoryBonusWeight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  menuCompletenessWeight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  menuFreshnessWeight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  menuGrossMarginWeight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultDishPenalty?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ticketPriceThreshold?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  ticketPriceCapMultiplier?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  recentDaysWindow?: number;
}
