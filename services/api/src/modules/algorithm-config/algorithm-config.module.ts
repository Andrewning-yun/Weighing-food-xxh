import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostingModule } from '../costing/costing.module';
import { AlgorithmConfigController } from './algorithm-config.controller';
import { AlgorithmConfig } from './algorithm-config.entity';
import { AlgorithmConfigService } from './algorithm-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([AlgorithmConfig]), CostingModule],
  controllers: [AlgorithmConfigController],
  providers: [AlgorithmConfigService],
  exports: [AlgorithmConfigService],
})
export class AlgorithmConfigModule {}
