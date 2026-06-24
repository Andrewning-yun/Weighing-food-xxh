import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AiSuggestion } from '../modules/ai/ai-suggestion.entity';
import { AlgorithmConfig } from '../modules/algorithm-config/algorithm-config.entity';
import { DailyMetric } from '../modules/daily-metric/daily-metric.entity';
import { DefaultDish } from '../modules/default-dish/default-dish.entity';
import { DailyInventory } from '../modules/inventory/inventory.entity';
import { Dish } from '../modules/dish/dish.entity';
import { DishFeedback } from '../modules/dish-feedback/dish-feedback.entity';
import { DishTypeTagRule } from '../modules/dish-type-tag/dish-type-tag.entity';
import { Ingredient } from '../modules/ingredient/ingredient.entity';
import { MenuPlan } from '../modules/menu-plan/menu-plan.entity';
import { MenuPairingRule } from '../modules/menu-pairing-rule/menu-pairing-rule.entity';
import { MenuStandard } from '../modules/menu-standard/menu-standard.entity';
import { OperationLog } from '../modules/operation-log/operation-log.entity';
import { Store } from '../modules/store/store.entity';
import { Task } from '../modules/task/task.entity';
import { User } from '../modules/user/user.entity';
import { InitialSchema20260408140000 } from './migrations/20260408140000-initial-schema';
import { AddV1Features20260412000000 } from './migrations/20260412000000-add-v1-features';
import { AddRecommendationSystem20260413000000 } from './migrations/20260413000000-add-recommendation-system';
import { AddAuditRecordTable20260414000000 } from './migrations/20260414000000-add-audit-record';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'fastfood_kitchen',
  logging: process.env.DB_LOGGING === 'true',
  synchronize: false,
  entities: [
    Store,
    User,
    Ingredient,
    Dish,
    DailyInventory,
    MenuPlan,
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
  ],
  migrations: [
    InitialSchema20260408140000,
    AddV1Features20260412000000,
    AddRecommendationSystem20260413000000,
    AddAuditRecordTable20260414000000,
  ],
});
