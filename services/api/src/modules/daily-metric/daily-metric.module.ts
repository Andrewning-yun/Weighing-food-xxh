import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostingModule } from '../costing/costing.module';
import { DailyMetric } from './daily-metric.entity';
import { DailyMetricController } from './daily-metric.controller';
import { DailyMetricService } from './daily-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyMetric]), CostingModule],
  controllers: [DailyMetricController],
  providers: [DailyMetricService],
  exports: [DailyMetricService],
})
export class DailyMetricModule {}
