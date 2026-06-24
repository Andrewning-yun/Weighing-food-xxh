import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from '../dish/dish.entity';
import { User } from '../user/user.entity';
import { AuditController } from './audit.controller';
import { AuditRecord } from './audit.entity';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditRecord, User, Dish])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
