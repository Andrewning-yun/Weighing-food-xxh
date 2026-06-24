import { IsArray, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryItem } from '../inventory.entity';

export class CreateInventoryDto {
  @IsString()
  storeId: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  items: InventoryItem[];
}

export class UpdateInventoryDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  items?: InventoryItem[];
}
