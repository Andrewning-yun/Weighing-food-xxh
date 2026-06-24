import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostingModule } from '../costing/costing.module';
import { User } from '../user/user.entity';
import { MenuPlanController } from './menu-plan.controller';
import { MenuPlan } from './menu-plan.entity';
import { MenuPlanService } from './menu-plan.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuPlan, User]), CostingModule],
  controllers: [MenuPlanController],
  providers: [MenuPlanService],
  exports: [MenuPlanService],
})
export class MenuPlanModule {}
