import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlgorithmConfig } from '../algorithm-config/algorithm-config.entity';
import { DailyMetric } from '../daily-metric/daily-metric.entity';
import { DefaultDish } from '../default-dish/default-dish.entity';
import { Dish } from '../dish/dish.entity';
import { DishFeedback } from '../dish-feedback/dish-feedback.entity';
import { Ingredient } from '../ingredient/ingredient.entity';
import { DailyInventory } from '../inventory/inventory.entity';
import { MenuPairingRule } from '../menu-pairing-rule/menu-pairing-rule.entity';
import { MenuPlan } from '../menu-plan/menu-plan.entity';
import { MenuStandard } from '../menu-standard/menu-standard.entity';
import { Store } from '../store/store.entity';
import { CostingCacheService } from './costing-cache.service';
import { CostingController } from './costing.controller';
import { CostingService } from './costing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dish,
      Ingredient,
      DailyInventory,
      MenuPlan,
      Store,
      DailyMetric,
      DishFeedback,
      DefaultDish,
      AlgorithmConfig,
      MenuPairingRule,
      MenuStandard,
    ]),
  ],
  controllers: [CostingController],
  providers: [CostingService, CostingCacheService],
  exports: [CostingService],
})
export class CostingModule {}
