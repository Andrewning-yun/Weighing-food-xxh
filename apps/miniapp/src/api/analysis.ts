import request from './request';

export type AnalysisMealType = 'breakfast' | 'lunch';

type AnalysisQuery = {
  storeId: string;
  startDate: string;
  endDate: string;
  mealType?: AnalysisMealType;
};

function toQuery(query: AnalysisQuery) {
  const params = new URLSearchParams();
  params.set('storeId', query.storeId);
  params.set('startDate', query.startDate);
  params.set('endDate', query.endDate);
  if (query.mealType) params.set('mealType', query.mealType);
  return params.toString();
}

export function fetchIngredientUsage(query: AnalysisQuery) {
  return request<{
    summary: { ingredientCount: number; totalUsage: number };
    items: Array<{ rank: number; ingredientId: string; ingredientName: string; category: string; count: number; totalQuantity: number; unit: string }>;
  }>({
    url: `/costing/analysis/ingredient-usage?${toQuery(query)}`,
    auth: true,
  });
}

export function fetchDishFrequency(query: AnalysisQuery) {
  return request<{
    summary: { dishCount: number; totalFrequency: number };
    items: Array<{ rank: number; dishId: string; dishName: string; category: string; frequency: number; mealType?: string }>;
  }>({
    url: `/costing/analysis/dish-frequency?${toQuery(query)}`,
    auth: true,
  });
}

export function fetchProfitDistribution(query: AnalysisQuery) {
  return request<{
    summary: { dishCount: number; averageGrossMargin: number };
    items: Array<{ key: string; label: string; count: number }>;
    dishes: Array<{ dishId: string; dishName: string; category: string; ingredientCost: number; estimatedMargin: number }>;
  }>({
    url: `/costing/analysis/profit-distribution?${toQuery(query)}`,
    auth: true,
  });
}

export function fetchCategoryDistribution(query: AnalysisQuery) {
  return request<{
    summary: { categoryCount: number; totalDishes: number };
    items: Array<{ category: string; count: number; ratio: number }>;
  }>({
    url: `/costing/analysis/category-distribution?${toQuery(query)}`,
    auth: true,
  });
}
