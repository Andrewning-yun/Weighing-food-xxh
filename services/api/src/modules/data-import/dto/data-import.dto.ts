import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export enum DataImportType {
  DISH = 'dish',
  INGREDIENT = 'ingredient',
}

export enum DataImportMode {
  MERGE = 'merge',
  REPLACE = 'replace',
  SKIP_DUPLICATE = 'skip_duplicate',
}

export class ParseDataImportDto {
  @IsEnum(DataImportType)
  type: DataImportType;

  @IsEnum(DataImportMode)
  mode: DataImportMode;
}

export class ExecuteDataImportDto {
  @IsEnum(DataImportType)
  type: DataImportType;

  @IsEnum(DataImportMode)
  mode: DataImportMode;

  @IsArray()
  items: Record<string, any>[];

  @IsString()
  @IsOptional()
  rawText?: string;
}
