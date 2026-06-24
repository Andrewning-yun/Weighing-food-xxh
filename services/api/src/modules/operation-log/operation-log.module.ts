import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from './operation-log.entity';
import { OperationLogController } from './operation-log.controller';
import { OperationLogService } from './operation-log.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OperationLog])],
  controllers: [OperationLogController],
  providers: [OperationLogService],
  exports: [OperationLogService],
})
export class OperationLogModule {}
