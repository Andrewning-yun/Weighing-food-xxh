import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { AuditAction, AuditModuleName } from '../audit.entity';

export class CreateAuditDto {
  @IsString()
  storeId: string;

  @IsEnum(AuditModuleName)
  module: AuditModuleName;

  @IsEnum(AuditAction)
  action: AuditAction;

  @IsString()
  targetId: string;

  @IsString()
  @IsOptional()
  targetName?: string;

  @IsString()
  @IsOptional()
  operatedBy?: string;

  @IsString()
  @IsOptional()
  operatedByName?: string;

  @IsObject()
  @IsOptional()
  before?: Record<string, unknown> | null;

  @IsObject()
  @IsOptional()
  after?: Record<string, unknown> | null;
}
