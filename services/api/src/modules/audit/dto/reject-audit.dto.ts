import { IsOptional, IsString } from 'class-validator';

export class RejectAuditDto {
  @IsString()
  @IsOptional()
  rejectReason?: string;
}
