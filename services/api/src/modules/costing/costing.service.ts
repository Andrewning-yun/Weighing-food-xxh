import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThanOrEqual, Repository } from 'typeorm';
import { AlgorithmConfig } from '../algorithm-config/algorithm-config.entity';
import { DailyMetric } from '../daily-metric/daily-metric.entity';
import { DefaultDish } from '../default-dish/default-dish.entity';
import { Dish, MealType } from '../dish/dish.entity';
import { DishFeedback, DishFeedbackLevel } from '../dish-feedback/dish-feedback.entity';
import { Ingredient } from '../ingredient/ingredient.entity';
import { DailyInventory, InventoryItem } from '../inventory/inventory.entity';
import { MenuPairingRule } from '../menu-pairing-rule/menu-pairing-rule.entity';
import { MenuPlan, MenuPlanDish } from '../menu-plan/menu-plan.entity';
import { MenuStandard } from '../menu-standard/menu-standard.entity';
import { Store } from '../store/store.entity';
import { calculateIngredientCost, estimateGrossMargin } from './costing.utils';
import { CostingCacheService } from './costing-cache.service';

export interface DishRecommendation {
  dishId: string;
  dishName: string;
  name: string;
  category: string;
  dishTypeTag?: string | null;
  score: number;
  reasons: string[];
  recommendWeight: 1 | 2 | 3;
  inventoryStatus: 'in_stock_perishable' | 'in_stock' | 'no_stock';
  ingredientCost: number;
  estimatedMargin: number;
}

export interface RecommendationGroup {
  id: string;
  storeId: string;
  date: string;
  mealType: MealType;
  dishes: DishRecommendation[];
  createdAt: string;
}

export interface MenuScoreDimension {
  key: 'completeness' | 'diversity' | 'freshness' | 'grossMargin';
  label: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface MenuPairingGap {
  tagCode: string;
  tagName: string;
  currentCount: number;
  minCount: number;
  maxCount?: number;
  gap: number;
  description?: string;
}

export interface MenuScoreResult {
  total: number;
  completeness: number;
  diversity: number;
  freshness: number;
  grossMargin: number;
  dimensions: MenuScoreDimension[];
  pairingGaps: MenuPairingGap[];
}

type AnalysisQuery = {
  storeId: string;
  startDate: string;
  endDate: string;
  mealType?: MealType;
};

export type ResolvedConfig = {
  ticketPriceBonusWeight: number;
  pairingBonusWeight: number;
  feedbackBonusWeight: number;
  diversityBonusWeight: number;
  categoryBonusWeight: number;
  menuCompletenessWeight: number;
  menuFreshnessWeight: number;
  menuGrossMarginWeight: number;
  defaultDishPenalty: number;
  ticketPriceThreshold: number;
  ticketPriceCapMultiplier: number;
  recentDaysWindow: number;
  recommendLimit: number;
};

@Injectable()
export class CostingService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(DailyInventory)
    private readonly dailyInventoryRepository: Repository<DailyInventory>,
    @InjectRepository(MenuPlan)
    private readonly menuPlanRepository: Repository<MenuPlan>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(DailyMetric)
    private readonly dailyMetricRepository: Repository<DailyMetric>,
    @InjectRepository(DishFeedback)
    private readonly dishFeedbackRepository: Repository<DishFeedback>,
    @InjectRepository(DefaultDish)
    private readonly defaultDishRepository: Repository<DefaultDish>,
    @InjectRepository(AlgorithmConfig)
    private readonly algorithmConfigRepository: Repository<AlgorithmConfig>,
    @InjectRepository(MenuPairingRule)
    private readonly menuPairingRuleRepository: Repository<MenuPairingRule>,
    @InjectRepository(MenuStandard)
    private readonly menuStandardRepository: Repository<MenuStandard>,
    private readonly cacheService: CostingCacheService,
  ) {}

  async calculateDishCost(dishId: string) {
    const dish = await this.dishRepository.findOneBy({ id: dishId });
    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    const ingredientIds = dish.ingredients?.map((item) => item.ingredientId) || [];
    const ingredients = ingredientIds.length
      ? await this.ingredientRepository
          .createQueryBuilder('ingredient')
          .where('ingredient.id IN (:...ids)', { ids: ingredientIds })
          .getMany()
      : [];

    const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    const ingredientCosts = (dish.ingredients || []).map((item) => {
      const ingredient = ingredientMap.get(item.ingredientId);
      const unitCost = Number(ingredient?.costPerUnit ?? ingredient?.price ?? 0);

      return {
        ingredientId: item.ingredientId,
        name: ingredient?.name || 'Unknown ingredient',
        cost: calculateIngredientCost(unitCost, item.quantity, item.wasteRate ?? 0),
      };
    });

    const totalCost = Number(ingredientCosts.reduce((sum, item) => sum + item.cost, 0).toFixed(2));

    await this.dishRepository.update(dish.id, {
      ingredientCost: totalCost,
    });

    return {
      dishId: dish.id,
      totalCost,
      ingredientCosts,
    };
  }

  async recalculateAllDishes() {
    const dishes = await this.dishRepository.find();
    const results = [];
    for (const dish of dishes) {
      results.push(await this.calculateDishCost(dish.id));
    }
    return results;
  }

  async getRecommendations(storeId: string, date?: string, mealType?: string): Promise<RecommendationGroup[]> {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const mealTypes = mealType ? [mealType as MealType] : [MealType.BREAKFAST, MealType.LUNCH];
    const createdAt = new Date().toISOString();
    const groups: RecommendationGroup[] = [];

    for (const currentMealType of mealTypes) {
      const cached = this.cacheService.getResult<DishRecommendation[]>(storeId, targetDate, currentMealType);
      if (cached) {
        groups.push({
          id: `${storeId}-${targetDate}-${currentMealType}`,
          storeId,
          date: targetDate,
          mealType: currentMealType,
          dishes: cached,
          createdAt,
        });
        continue;
      }

      const dishes = await this.getRecommendationsForMeal(storeId, targetDate, currentMealType);
      this.cacheService.setResult(storeId, targetDate, currentMealType, dishes);
      groups.push({
        id: `${storeId}-${targetDate}-${currentMealType}`,
        storeId,
        date: targetDate,
        mealType: currentMealType,
        dishes,
        createdAt,
      });
    }

    return groups.filter((group) => group.dishes.length > 0 || mealType != null);
  }

  /** 门店数据变更后清除缓存，由 controller 或 event 调用 */
  invalidateStoreCache(storeId: string): void {
    this.cacheService.invalidateStore(storeId);
  }

  /** 全局配置变更后清除所有缓存 */
  invalidateAllCache(): void {
    this.cacheService.invalidateAll();
  }

  async scoreMenuSelection(input: {
    storeId: string;
    date: string;
    mealType: MealType;
    dishes: Array<Pick<MenuPlanDish, 'dishId'>>;
  }): Promise<MenuScoreResult> {
    const config = await this.getResolvedConfig(input.storeId);
    const store = await this.storeRepository.findOne({ where: { id: input.storeId } });
    const pricePerLiang = Number(store?.pricePerLiang ?? 0);
    const dishIds = input.dishes.map((item) => item.dishId);
    const dishes = dishIds.length ? await this.dishRepository.find({ where: { id: In(dishIds) } }) : [];
    const standards = await this.menuStandardRepository.find({
      where: { storeId: input.storeId, mealType: input.mealType },
    });
    const pairingRules = await this.menuPairingRuleRepository.find({
      where: { storeId: input.storeId, mealType: input.mealType, isActive: true },
    });
    const dayOfWeek = this.getDayOfWeek(input.date);
    const defaultDishIds = new Set(
      (
        await this.defaultDishRepository.find({
          where: { storeId: input.storeId, mealType: input.mealType, dayOfWeek, isActive: true },
        })
      ).map((item) => item.dishId),
    );
    const scoredDishes = dishes.filter((dish) => !defaultDishIds.has(dish.id));
    const recentPlans = await this.findRecentMenuPlans(
      input.storeId,
      input.date,
      config.recentDaysWindow,
      input.mealType,
    );

    const completeness = this.calculateCompletenessScore(scoredDishes, standards) * config.menuCompletenessWeight;
    const diversity = this.calculateMenuDiversityScore(scoredDishes) * config.diversityBonusWeight;
    const freshness = this.calculateMenuFreshnessScore(scoredDishes, recentPlans) * config.menuFreshnessWeight;
    const grossMargin = this.calculateMenuGrossMarginScore(scoredDishes, pricePerLiang) * config.menuGrossMarginWeight;
    const pairingGaps = this.buildPairingGaps(scoredDishes, pairingRules);

    const dimensions: MenuScoreDimension[] = [
      {
        key: 'completeness',
        label: '完整度',
        score: Number(completeness.toFixed(2)),
        maxScore: 30,
        description: '按菜单标准检查各分类数量是否达标',
      },
      {
        key: 'diversity',
        label: '多样性',
        score: Number(diversity.toFixed(2)),
        maxScore: 30,
        description: '按食材和标签覆盖度避免菜单过度重复',
      },
      {
        key: 'freshness',
        label: '新鲜度',
        score: Number(freshness.toFixed(2)),
        maxScore: 20,
        description: '鼓励近期未出现的菜品进入当前菜单',
      },
      {
        key: 'grossMargin',
        label: '毛利结构',
        score: Number(grossMargin.toFixed(2)),
        maxScore: 20,
        description: '保持高毛利与引流菜的结构平衡',
      },
    ];

    return {
      total: Number((completeness + diversity + freshness + grossMargin).toFixed(2)),
      completeness: Number(completeness.toFixed(2)),
      diversity: Number(diversity.toFixed(2)),
      freshness: Number(freshness.toFixed(2)),
      grossMargin: Number(grossMargin.toFixed(2)),
      dimensions,
      pairingGaps,
    };
  }

  async getMenuScoreHistory(storeId: string, startDate: string, endDate: string, mealType?: MealType) {
    const plans = await this.menuPlanRepository.find({
      where: mealType
        ? { storeId, mealType, date: Between(startDate, endDate) }
        : { storeId, date: Between(startDate, endDate) },
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    return Promise.all(
      plans.map(async (plan) => ({
        id: plan.id,
        date: plan.date,
        mealType: plan.mealType,
        status: plan.status,
        menuScore: await this.scoreMenuSelection({
          storeId: plan.storeId,
          date: plan.date,
          mealType: plan.mealType,
          dishes: plan.dishes || [],
        }),
      })),
    );
  }

  async getIngredientUsageAnalysis(storeId: string, startDate: string, endDate: string, mealType?: MealType) {
    const dishes = await this.findPlannedDishes({ storeId, startDate, endDate, mealType });
    const ingredientMap = await this.buildIngredientMap(dishes);
    const usageMap = new Map<string, { ingredientId: string; ingredientName: string; category: string; count: number; totalQuantity: number; unit: string }>();

    for (const dish of dishes) {
      for (const item of dish.ingredients || []) {
        const ingredient = ingredientMap.get(item.ingredientId);
        const current = usageMap.get(item.ingredientId) || {
          ingredientId: item.ingredientId,
          ingredientName: ingredient?.name || item.ingredientId,
          category: String(ingredient?.category || '未分类'),
          count: 0,
          totalQuantity: 0,
          unit: item.unit || ingredient?.unit || '份',
        };
        current.count += 1;
        current.totalQuantity += Number(item.quantity || 0);
        usageMap.set(item.ingredientId, current);
      }
    }

    const items = Array.from(usageMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity || b.count - a.count)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
        totalQuantity: Number(item.totalQuantity.toFixed(2)),
      }));

    return {
      summary: {
        ingredientCount: items.length,
        totalUsage: Number(items.reduce((sum, item) => sum + item.totalQuantity, 0).toFixed(2)),
      },
      items,
    };
  }

  async getDishFrequencyAnalysis(storeId: string, startDate: string, endDate: string, mealType?: MealType) {
    const plans = await this.menuPlanRepository.find({
      where: mealType
        ? { storeId, mealType, date: Between(startDate, endDate) }
        : { storeId, date: Between(startDate, endDate) },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    const dishIds = Array.from(new Set(plans.flatMap((plan) => (plan.dishes || []).map((item) => item.dishId))));
    const dishes = dishIds.length ? await this.dishRepository.find({ where: { id: In(dishIds) } }) : [];
    const dishMap = new Map(dishes.map((dish) => [dish.id, dish]));
    const counts = new Map<string, { dishId: string; dishName: string; category: string; frequency: number; mealType?: string }>();

    for (const plan of plans) {
      for (const item of plan.dishes || []) {
        const dish = dishMap.get(item.dishId);
        const current = counts.get(item.dishId) || {
          dishId: item.dishId,
          dishName: dish?.name || item.dishId,
          category: String(dish?.category || '未分类'),
          frequency: 0,
          mealType: dish?.mealType,
        };
        current.frequency += 1;
        counts.set(item.dishId, current);
      }
    }

    const items = Array.from(counts.values())
      .sort((a, b) => b.frequency - a.frequency)
      .map((item, index) => ({ rank: index + 1, ...item }));

    return {
      summary: {
        dishCount: items.length,
        totalFrequency: items.reduce((sum, item) => sum + item.frequency, 0),
      },
      items,
    };
  }

  async getProfitDistributionAnalysis(storeId: string, startDate: string, endDate: string, mealType?: MealType) {
    const dishes = await this.findPlannedDishes({ storeId, startDate, endDate, mealType });
    const buckets = [
      { key: 'low', label: '低毛利', min: 0, max: 0.4, count: 0 },
      { key: 'medium', label: '中毛利', min: 0.4, max: 0.6, count: 0 },
      { key: 'high', label: '高毛利', min: 0.6, max: 1.1, count: 0 },
    ];

    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    const pricePerLiang = Number(store?.pricePerLiang ?? 0);

    const items = dishes.map((dish) => {
      const ingredientCost = Number(dish.ingredientCost || 0);
      const estimatedMargin = estimateGrossMargin(ingredientCost, pricePerLiang);
      return {
        dishId: dish.id,
        dishName: dish.name,
        category: dish.category,
        ingredientCost,
        estimatedMargin,
      };
    });

    for (const dish of items) {
      const bucket =
        buckets.find((item) => dish.estimatedMargin >= item.min && dish.estimatedMargin < item.max) ||
        buckets[buckets.length - 1];
      bucket.count += 1;
    }

    return {
      summary: {
        dishCount: items.length,
        averageGrossMargin:
          items.length > 0
            ? Number((items.reduce((sum, item) => sum + item.estimatedMargin, 0) / items.length).toFixed(2))
            : 0,
      },
      items: buckets.map((item) => ({
        key: item.key,
        label: item.label,
        count: item.count,
      })),
      dishes: items.sort((a, b) => b.estimatedMargin - a.estimatedMargin),
    };
  }

  async getCategoryDistributionAnalysis(storeId: string, startDate: string, endDate: string, mealType?: MealType) {
    const dishes = await this.findPlannedDishes({ storeId, startDate, endDate, mealType });
    const total = dishes.length;
    const categoryMap = new Map<string, number>();

    for (const dish of dishes) {
      categoryMap.set(dish.category, (categoryMap.get(dish.category) || 0) + 1);
    }

    const items = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        ratio: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      summary: {
        categoryCount: items.length,
        totalDishes: total,
      },
      items,
    };
  }

  private async getRecommendationsForMeal(storeId: string, targetDate: string, mealType: MealType) {
    const [store, config, currentPlan, defaultDishes, standards, pairingRules] = await Promise.all([
      this.storeRepository.findOne({ where: { id: storeId } }),
      this.getResolvedConfig(storeId),
      this.menuPlanRepository.findOne({
        where: { storeId, date: targetDate, mealType },
        order: { createdAt: 'DESC' },
      }),
      this.defaultDishRepository.find({
        where: {
          storeId,
          mealType,
          dayOfWeek: this.getDayOfWeek(targetDate),
          isActive: true,
        },
      }),
      this.menuStandardRepository.find({ where: { storeId, mealType } }),
      this.menuPairingRuleRepository.find({ where: { storeId, mealType, isActive: true } }),
    ]);

    const targetPrice =
      mealType === MealType.BREAKFAST
        ? Number(store?.targetTicketPriceBreakfast ?? 0)
        : Number(store?.targetTicketPriceLunch ?? 0);
    const currentPlanDishIds = new Set((currentPlan?.dishes || []).map((item) => item.dishId));
    const defaultDishIds = new Set(defaultDishes.map((item) => item.dishId));
    const dishes = await this.dishRepository.find({
      where: {
        isActive: true,
        mealType,
      },
    });
    const candidateDishes = dishes.filter((dish) => !defaultDishIds.has(dish.id));
    if (candidateDishes.length === 0) {
      return [];
    }

    const ingredientMap = await this.buildIngredientMap(candidateDishes);
    const dailyInventory = await this.dailyInventoryRepository.findOne({
      where: {
        storeId,
        date: LessThanOrEqual(targetDate),
      },
      order: { date: 'DESC' },
    });
    const inventoryByIngredientId = new Map<string, InventoryItem>();
    if (dailyInventory?.items) {
      for (const item of dailyInventory.items) {
        inventoryByIngredientId.set(item.ingredientId, item);
      }
    }

    const recentPlans = await this.findRecentMenuPlans(storeId, targetDate, config.recentDaysWindow, mealType);
    const dishFrequencyMap = new Map<string, number>();
    for (const plan of recentPlans) {
      for (const planDish of plan.dishes || []) {
        dishFrequencyMap.set(planDish.dishId, (dishFrequencyMap.get(planDish.dishId) || 0) + 1);
      }
    }

    const previousMetric = await this.dailyMetricRepository.findOne({
      where: { storeId, mealType, date: this.previousDate(targetDate) },
      order: { createdAt: 'DESC' },
    });
    const feedbackRecords = await this.dishFeedbackRepository.find({
      where: {
        storeId,
        mealType,
        date: Between(this.shiftDate(targetDate, -config.recentDaysWindow), targetDate),
      },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    const feedbackByDishId = new Map<string, DishFeedback[]>();
    for (const feedback of feedbackRecords) {
      const current = feedbackByDishId.get(feedback.dishId) || [];
      current.push(feedback);
      feedbackByDishId.set(feedback.dishId, current);
    }

    const currentPlanDishes = currentPlan?.dishes?.length
      ? dishes.filter((dish) => currentPlanDishIds.has(dish.id))
      : [];

    const pricePerLiang = Number(store?.pricePerLiang ?? 0);

    const recommendations = candidateDishes.map((dish) => {
      const reasons: string[] = [];
      const ingredientCost = Number(dish.ingredientCost || 0);
      const estimatedMargin = estimateGrossMargin(ingredientCost, pricePerLiang);
      const baseScore = estimatedMargin * 100;
      const recWeight = Math.min(Math.max(dish.recommendWeight || 1, 1), 3) as 1 | 2 | 3;
      const recommendBonus = recWeight * 30;
      if (recWeight >= 2) {
        reasons.push(`管理权重 ${recWeight} 星`);
      }

      const inventory = this.calculateInventoryBonus(dish, ingredientMap, inventoryByIngredientId);
      reasons.push(...inventory.reasons);

      const recentFrequency = dishFrequencyMap.get(dish.id) || 0;
      const frequencyPenalty = recentFrequency * 5;
      if (recentFrequency > 0) {
        reasons.push(`近 ${config.recentDaysWindow} 天出现 ${recentFrequency} 次`);
      }

      const ticketPriceBonus = this.calculateTicketPriceBonus(
        dish,
        previousMetric,
        targetPrice,
        config,
        reasons,
        pricePerLiang,
      );
      const pairingBonus = this.calculatePairingBonus(dish, currentPlanDishes, pairingRules, config, reasons);
      const feedbackBonus = this.calculateFeedbackBonus(
        feedbackByDishId.get(dish.id) || [],
        config,
        reasons,
      );
      const diversityBonus = this.calculateDiversityBonus(
        dish,
        currentPlanDishes,
        ingredientMap,
        config,
        reasons,
      );
      const categoryBonus = this.calculateCategoryBonus(dish, currentPlanDishes, standards, config, reasons);
      const score = Number(
        (
          baseScore +
          recommendBonus +
          inventory.bonus -
          frequencyPenalty +
          ticketPriceBonus +
          pairingBonus +
          feedbackBonus +
          diversityBonus +
          categoryBonus
        ).toFixed(2),
      );

      return {
        dishId: dish.id,
        dishName: dish.name,
        name: dish.name,
        category: dish.category,
        dishTypeTag: dish.dishTypeTag,
        score,
        reasons,
        recommendWeight: recWeight,
        inventoryStatus: inventory.status,
        ingredientCost,
        estimatedMargin: Number((estimatedMargin * 100).toFixed(2)),
      } satisfies DishRecommendation;
    });

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, config.recommendLimit || 20);
  }

  private async buildIngredientMap(dishes: Dish[]) {
    const allIngredientIds = new Set<string>();
    for (const dish of dishes) {
      for (const item of dish.ingredients || []) {
        allIngredientIds.add(item.ingredientId);
      }
    }

    const ingredients = allIngredientIds.size
      ? await this.ingredientRepository.find({
          where: { id: In([...allIngredientIds]) },
        })
      : [];

    return new Map(ingredients.map((i) => [i.id, i]));
  }

  private async findPlannedDishes(query: AnalysisQuery) {
    const plans = await this.menuPlanRepository.find({
      where: query.mealType
        ? { storeId: query.storeId, mealType: query.mealType, date: Between(query.startDate, query.endDate) }
        : { storeId: query.storeId, date: Between(query.startDate, query.endDate) },
    });
    const dishIds = Array.from(new Set(plans.flatMap((plan) => (plan.dishes || []).map((item) => item.dishId))));
    if (dishIds.length === 0) {
      return [] as Dish[];
    }
    return this.dishRepository.find({ where: { id: In(dishIds) } });
  }

  private async findRecentMenuPlans(storeId: string, targetDate: string, recentDaysWindow: number, mealType?: MealType) {
    const startDate = this.shiftDate(targetDate, -recentDaysWindow);
    return this.menuPlanRepository.find({
      where: mealType
        ? { storeId, mealType, date: Between(startDate, targetDate) }
        : { storeId, date: Between(startDate, targetDate) },
    });
  }

  private calculateInventoryBonus(
    dish: Dish,
    ingredientMap: Map<string, Ingredient>,
    inventoryByIngredientId: Map<string, InventoryItem>,
  ) {
    const reasons: string[] = [];
    let hasPerishableIngredient = false;
    let perishableInStock = false;
    let anyIngredientInStock = false;

    for (const dishItem of dish.ingredients || []) {
      const ingredient = ingredientMap.get(dishItem.ingredientId);
      const invItem = inventoryByIngredientId.get(dishItem.ingredientId);

      if (ingredient?.perishable) {
        hasPerishableIngredient = true;
        if (invItem && invItem.quantity > 0) {
          perishableInStock = true;
          reasons.push(`今日库存有易耗食材 ${ingredient.name}`);
        }
      }

      if (invItem && invItem.quantity > 0) {
        anyIngredientInStock = true;
      }
    }

    if (hasPerishableIngredient && perishableInStock) {
      return { bonus: 40, status: 'in_stock_perishable' as const, reasons };
    }
    if (hasPerishableIngredient && !perishableInStock) {
      return { bonus: -10, status: 'no_stock' as const, reasons };
    }
    if (anyIngredientInStock) {
      return { bonus: 10, status: 'in_stock' as const, reasons: ['库存可直接支撑出品'] };
    }
    return { bonus: 0, status: 'no_stock' as const, reasons };
  }

  private calculateTicketPriceBonus(
    dish: Dish,
    previousMetric: DailyMetric | null,
    targetPrice: number,
    config: ResolvedConfig,
    reasons: string[],
    pricePerLiang: number,
  ) {
    if (!previousMetric || targetPrice <= 0) {
      return 0;
    }

    const actualPrice = Number(previousMetric.ticketPrice || 0);
    const deviation = (actualPrice - targetPrice) / targetPrice;
    const threshold = config.ticketPriceThreshold || 0.1;
    if (Math.abs(deviation) < threshold) {
      return 0;
    }

    const severity = Math.min(Math.abs(deviation) / threshold, config.ticketPriceCapMultiplier || 3);
    const margin = estimateGrossMargin(Number(dish.ingredientCost || 0), pricePerLiang);
    let rawBonus = 0;

    if (deviation < 0) {
      rawBonus += margin >= 0.6 ? 10 : 3;
      rawBonus += dish.dishTypeTag === 'big_meat' ? 12 : dish.dishTypeTag === 'small_meat' ? 6 : -2;
      reasons.push(`前一日客单价低于目标 ${Math.round(Math.abs(deviation) * 100)}%，优先提价型菜品`);
    } else {
      rawBonus += margin < 0.55 ? 6 : 1;
      rawBonus += dish.dishTypeTag === 'vegetable' ? 8 : dish.dishTypeTag === 'small_meat' ? 4 : -3;
      reasons.push(`前一日客单价高于目标 ${Math.round(Math.abs(deviation) * 100)}%，优先平衡体感价格`);
    }

    return Number((rawBonus * severity * config.ticketPriceBonusWeight).toFixed(2));
  }

  private calculatePairingBonus(
    dish: Dish,
    currentPlanDishes: Dish[],
    pairingRules: MenuPairingRule[],
    config: ResolvedConfig,
    reasons: string[],
  ) {
    if (!dish.dishTypeTag || pairingRules.length === 0) {
      return 0;
    }
    const tagCounts = new Map<string, number>();
    for (const item of currentPlanDishes) {
      if (item.dishTypeTag) {
        tagCounts.set(item.dishTypeTag, (tagCounts.get(item.dishTypeTag) || 0) + 1);
      }
    }
    const rule = pairingRules.find((item) => item.tagCode === dish.dishTypeTag);
    if (!rule) {
      return 0;
    }
    const gap = Math.max(rule.minCount - (tagCounts.get(rule.tagCode) || 0), 0);
    if (gap <= 0) {
      return 0;
    }
    reasons.push(`${this.getTagDisplayName(rule.tagCode)} 还缺 ${gap} 道`);
    return Number(Math.min(gap * 5, 20) * config.pairingBonusWeight);
  }

  private calculateFeedbackBonus(records: DishFeedback[], config: ResolvedConfig, reasons: string[]) {
    if (records.length === 0) {
      reasons.push('近 7 天无剩余异常反馈');
      return Number((3 * config.feedbackBonusWeight).toFixed(2));
    }

    let raw = 0;
    for (const record of records) {
      if (record.feedbackLevel === DishFeedbackLevel.HIGH) raw -= 8;
      if (record.feedbackLevel === DishFeedbackLevel.MEDIUM) raw -= 4;
      if (record.feedbackLevel === DishFeedbackLevel.LOW) raw -= 1;
      if (record.feedbackLevel === DishFeedbackLevel.NONE) raw += 2;
    }
    if (raw < 0) {
      reasons.push(`近 7 天有 ${records.length} 条剩余反馈，已下调推荐`);
    } else if (raw > 0) {
      reasons.push('近 7 天表现稳定，轻微加分');
    }
    return Number(((raw / records.length) * config.feedbackBonusWeight).toFixed(2));
  }

  private calculateDiversityBonus(
    dish: Dish,
    currentPlanDishes: Dish[],
    ingredientMap: Map<string, Ingredient>,
    config: ResolvedConfig,
    reasons: string[],
  ) {
    const planIngredientCategories = new Set<string>();
    for (const planDish of currentPlanDishes) {
      for (const item of planDish.ingredients || []) {
        const ingredient = ingredientMap.get(item.ingredientId);
        if (ingredient?.category) {
          planIngredientCategories.add(String(ingredient.category));
        }
      }
    }
    const ownCategories = new Set<string>();
    for (const item of dish.ingredients || []) {
      const ingredient = ingredientMap.get(item.ingredientId);
      if (ingredient?.category) {
        ownCategories.add(String(ingredient.category));
      }
    }
    const newCategories = [...ownCategories].filter((category) => !planIngredientCategories.has(category));
    const rawBonus = Math.min(newCategories.length * 3, 12);
    if (rawBonus > 0) {
      reasons.push(`带来 ${newCategories.length} 类新食材组合`);
    }
    return Number((rawBonus * config.diversityBonusWeight).toFixed(2));
  }

  private calculateCategoryBonus(
    dish: Dish,
    currentPlanDishes: Dish[],
    standards: MenuStandard[],
    config: ResolvedConfig,
    reasons: string[],
  ) {
    const standard = standards.find((item) => item.category === dish.category);
    if (!standard) {
      return 0;
    }
    const currentCount = currentPlanDishes.filter((item) => item.category === dish.category).length;
    const gap = Math.max(standard.targetCount - currentCount, 0);
    if (gap <= 0) {
      return 0;
    }
    reasons.push(`${dish.category} 分类当前未达菜单标准`);
    return Number(Math.min(gap * 4, 16) * config.categoryBonusWeight);
  }

  private calculateCompletenessScore(dishes: Dish[], standards: MenuStandard[]) {
    if (standards.length === 0) {
      return 30;
    }
    const totalTarget = standards.reduce((sum, item) => sum + Number(item.targetCount || 0), 0);
    if (totalTarget <= 0) {
      return 30;
    }
    let covered = 0;
    for (const standard of standards) {
      const count = dishes.filter((dish) => dish.category === standard.category).length;
      covered += Math.min(count, Number(standard.targetCount || 0));
    }
    return Math.min((covered / totalTarget) * 30, 30);
  }

  private calculateMenuDiversityScore(dishes: Dish[]) {
    if (dishes.length === 0) {
      return 0;
    }
    const relatedIngredients = new Set<string>();
    const typeTags = new Set<string>();
    for (const dish of dishes) {
      if (dish.dishTypeTag) {
        typeTags.add(dish.dishTypeTag);
      }
      for (const token of String(dish.relatedIngredients || '')
        .split(/[、,，\s]+/)
        .filter(Boolean)) {
        relatedIngredients.add(token);
      }
    }
    return Math.min(relatedIngredients.size * 1.5 + typeTags.size * 4, 30);
  }

  private calculateMenuFreshnessScore(dishes: Dish[], recentPlans: MenuPlan[]) {
    if (dishes.length === 0) {
      return 0;
    }
    const recentDishIds = new Set<string>();
    for (const plan of recentPlans) {
      for (const item of plan.dishes || []) {
        recentDishIds.add(item.dishId);
      }
    }
    const freshCount = dishes.filter((dish) => !recentDishIds.has(dish.id)).length;
    return Math.min((freshCount / dishes.length) * 20, 20);
  }

  private calculateMenuGrossMarginScore(dishes: Dish[], pricePerLiang: number) {
    if (dishes.length === 0) {
      return 0;
    }
    let high = 0, medium = 0, low = 0;
    for (const dish of dishes) {
      const margin = estimateGrossMargin(Number(dish.ingredientCost || 0), pricePerLiang);
      if (margin >= 0.65) high++;
      else if (margin >= 0.45) medium++;
      else low++;
    }
    let score = 0;
    if (high > 0) score += 8;
    if (medium > 0) score += 8;
    if (low <= Math.ceil(dishes.length * 0.3)) score += 4;
    return Math.min(score, 20);
  }

  private buildPairingGaps(dishes: Dish[], pairingRules: MenuPairingRule[]) {
    const counts = new Map<string, number>();
    for (const dish of dishes) {
      if (dish.dishTypeTag) {
        counts.set(dish.dishTypeTag, (counts.get(dish.dishTypeTag) || 0) + 1);
      }
    }
    return pairingRules
      .map((rule) => {
        const currentCount = counts.get(rule.tagCode) || 0;
        return {
          tagCode: rule.tagCode,
          tagName: this.getTagDisplayName(rule.tagCode),
          currentCount,
          minCount: rule.minCount,
          maxCount: rule.maxCount || undefined,
          gap: Math.max(rule.minCount - currentCount, 0),
          description: rule.description || undefined,
        } satisfies MenuPairingGap;
      })
      .filter((item) => item.gap > 0);
  }

  private async getResolvedConfig(storeId: string): Promise<ResolvedConfig> {
    const cached = this.cacheService.getConfig(storeId);
    if (cached) return cached;

    const config = await this.algorithmConfigRepository.findOne({ where: { storeId } });
    const resolved: ResolvedConfig = {
      ticketPriceBonusWeight: Number(config?.ticketPriceBonusWeight ?? 1),
      pairingBonusWeight: Number(config?.pairingBonusWeight ?? 1),
      feedbackBonusWeight: Number(config?.feedbackBonusWeight ?? 1),
      diversityBonusWeight: Number(config?.diversityBonusWeight ?? 1),
      categoryBonusWeight: Number(config?.categoryBonusWeight ?? 1),
      menuCompletenessWeight: Number(config?.menuCompletenessWeight ?? 1),
      menuFreshnessWeight: Number(config?.menuFreshnessWeight ?? 1),
      menuGrossMarginWeight: Number(config?.menuGrossMarginWeight ?? 1),
      defaultDishPenalty: Number(config?.defaultDishPenalty ?? 1),
      ticketPriceThreshold: Number(config?.ticketPriceThreshold ?? 0.1),
      ticketPriceCapMultiplier: Number(config?.ticketPriceCapMultiplier ?? 3),
      recentDaysWindow: Number(config?.recentDaysWindow ?? 7),
      recommendLimit: Number(config?.recommendLimit ?? 20),
    };

    this.cacheService.setConfig(storeId, resolved);
    return resolved;
  }

  private getTagDisplayName(tagCode: string) {
    if (tagCode === 'big_meat') return '大荤';
    if (tagCode === 'small_meat') return '小荤';
    if (tagCode === 'vegetable') return '素菜';
    return tagCode;
  }

  private shiftDate(date: string, deltaDays: number) {
    const target = new Date(date);
    target.setDate(target.getDate() + deltaDays);
    return target.toISOString().slice(0, 10);
  }

  private previousDate(date: string) {
    return this.shiftDate(date, -1);
  }

  private getDayOfWeek(date: string) {
    return new Date(date).getDay();
  }
}
