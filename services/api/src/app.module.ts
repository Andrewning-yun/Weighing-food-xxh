import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseOptions } from './database/database-options';
import { DevSeedService } from './database/dev-seed.service';
import { AiModule } from './modules/ai/ai.module';
import { AiSuggestion } from './modules/ai/ai-suggestion.entity';
import { AlgorithmConfigModule } from './modules/algorithm-config/algorithm-config.module';
import { AlgorithmConfig } from './modules/algorithm-config/algorithm-config.entity';
import { AuditModule } from './modules/audit/audit.module';
import { AuditRecord } from './modules/audit/audit.entity';
import { AuthModule } from './modules/auth/auth.module';
import { CostingModule } from './modules/costing/costing.module';
import { DailyMetricModule } from './modules/daily-metric/daily-metric.module';
import { DailyMetric } from './modules/daily-metric/daily-metric.entity';
import { DataImportModule } from './modules/data-import/data-import.module';
import { DefaultDishModule } from './modules/default-dish/default-dish.module';
import { DefaultDish } from './modules/default-dish/default-dish.entity';
import { Dish } from './modules/dish/dish.entity';
import { DishModule } from './modules/dish/dish.module';
import { DishFeedbackModule } from './modules/dish-feedback/dish-feedback.module';
import { DishFeedback } from './modules/dish-feedback/dish-feedback.entity';
import { DishTypeTagModule } from './modules/dish-type-tag/dish-type-tag.module';
import { DishTypeTagRule } from './modules/dish-type-tag/dish-type-tag.entity';
import { DailyInventory } from './modules/inventory/inventory.entity';
import { InventoryModule } from './modules/inventory/inventory.module';
import { Ingredient } from './modules/ingredient/ingredient.entity';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { MenuPlan } from './modules/menu-plan/menu-plan.entity';
import { MenuPlanModule } from './modules/menu-plan/menu-plan.module';
import { MenuPairingRuleModule } from './modules/menu-pairing-rule/menu-pairing-rule.module';
import { MenuPairingRule } from './modules/menu-pairing-rule/menu-pairing-rule.entity';
import { MenuStandardModule } from './modules/menu-standard/menu-standard.module';
import { MenuStandard } from './modules/menu-standard/menu-standard.entity';
import { OperationLog } from './modules/operation-log/operation-log.entity';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { Store } from './modules/store/store.entity';
import { StoreModule } from './modules/store/store.module';
import { SupplementaryOrder } from './modules/supplementary-order/supplementary-order.entity';
import { SupplementaryOrderModule } from './modules/supplementary-order/supplementary-order.module';
import { Task } from './modules/task/task.entity';
import { TaskModule } from './modules/task/task.module';
import { User } from './modules/user/user.entity';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseOptions()),
    TypeOrmModule.forFeature([
      Store,
      User,
      Ingredient,
      Dish,
      MenuPlan,
      DailyInventory,
      Task,
      OperationLog,
      DailyMetric,
      DishFeedback,
      MenuStandard,
      DefaultDish,
      AlgorithmConfig,
      DishTypeTagRule,
      MenuPairingRule,
      AiSuggestion,
      AuditRecord,
      SupplementaryOrder,
    ]),
    AuditModule,
    AuthModule,
    DataImportModule,
    StoreModule,
    UserModule,
    DishModule,
    IngredientModule,
    CostingModule,
    InventoryModule,
    MenuPlanModule,
    TaskModule,
    OperationLogModule,
    DailyMetricModule,
    DishFeedbackModule,
    MenuStandardModule,
    DefaultDishModule,
    AlgorithmConfigModule,
    DishTypeTagModule,
    MenuPairingRuleModule,
    AiModule,
    SupplementaryOrderModule,
  ],
  providers: [DevSeedService],
})
export class AppModule {}
