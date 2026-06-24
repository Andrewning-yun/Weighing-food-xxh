import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { MealType } from '../dish/dish.entity';
import { UserRole } from '../user/user.entity';
import { CostingService } from './costing.service';

@Controller()
@UseGuards(AuthGuard)
export class CostingController {
  constructor(private readonly costingService: CostingService) {}

  @Get('costing/dishes/:id')
  calculateDishCost(@Param('id') id: string) {
    return this.costingService.calculateDishCost(id);
  }

  @Get('costing/recommendations')
  @Roles(
    UserRole.ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CHEF_MANAGER,
    UserRole.CHEF,
    UserRole.BUYER,
    UserRole.BREAKFAST_CHEF,
  )
  getRecommendations(
    @Query('storeId') storeId: string,
    @Query('date') date?: string,
    @Query('mealType') mealType?: string,
  ) {
    return this.costingService.getRecommendations(storeId, date, mealType);
  }

  @Post('menu-score')
  @Roles(
    UserRole.ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CHEF_MANAGER,
    UserRole.CHEF,
    UserRole.BUYER,
    UserRole.BREAKFAST_CHEF,
  )
  scoreMenu(
    @Body()
    body: { storeId: string; date: string; mealType: MealType; dishes: Array<{ dishId: string }> },
  ) {
    return this.costingService.scoreMenuSelection(body);
  }

  @Get('menu-score/history')
  @Roles(
    UserRole.ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CHEF_MANAGER,
    UserRole.CHEF,
    UserRole.BUYER,
    UserRole.BREAKFAST_CHEF,
  )
  getMenuScoreHistory(
    @Query('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('mealType') mealType?: MealType,
  ) {
    return this.costingService.getMenuScoreHistory(storeId, startDate, endDate, mealType);
  }

  @Get('costing/analysis/ingredient-usage')
  @Roles(
    UserRole.ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CHEF_MANAGER,
    UserRole.CHEF,
    UserRole.PREP,
    UserRole.BUYER,
    UserRole.BREAKFAST_CHEF,
    UserRole.BREAKFAST_ASSISTANT,
  )
  getIngredientUsage(
    @Query('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('mealType') mealType?: MealType,
  ) {
    return this.costingService.getIngredientUsageAnalysis(storeId, startDate, endDate, mealType);
  }

  @Get('costing/analysis/dish-frequency')
  @Roles(
    UserRole.ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CHEF_MANAGER,
    UserRole.CHEF,
    UserRole.PREP,
    UserRole.BUYER,
    UserRole.BREAKFAST_CHEF,
    UserRole.BREAKFAST_ASSISTANT,
  )
  getDishFrequency(
    @Query('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('mealType') mealType?: MealType,
  ) {
    return this.costingService.getDishFrequencyAnalysis(storeId, startDate, endDate, mealType);
  }

  @Get('costing/analysis/profit-distribution')
  @Roles(
    UserRole.ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CHEF_MANAGER,
    UserRole.CHEF,
    UserRole.PREP,
    UserRole.BUYER,
    UserRole.BREAKFAST_CHEF,
    UserRole.BREAKFAST_ASSISTANT,
  )
  getProfitDistribution(
    @Query('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('mealType') mealType?: MealType,
  ) {
    return this.costingService.getProfitDistributionAnalysis(storeId, startDate, endDate, mealType);
  }

  @Get('costing/analysis/category-distribution')
  @Roles(
    UserRole.ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CHEF_MANAGER,
    UserRole.CHEF,
    UserRole.PREP,
    UserRole.BUYER,
    UserRole.BREAKFAST_CHEF,
    UserRole.BREAKFAST_ASSISTANT,
  )
  getCategoryDistribution(
    @Query('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('mealType') mealType?: MealType,
  ) {
    return this.costingService.getCategoryDistributionAnalysis(storeId, startDate, endDate, mealType);
  }
}
