import request from './request';

export interface RecommendationDish {
  dishId: string;
  dishName?: string;
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
  mealType: 'breakfast' | 'lunch';
  dishes: RecommendationDish[];
  createdAt: string;
}

export function fetchRecommendations(query: {
  storeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch';
}) {
  return request<RecommendationGroup[]>({
    url: `/costing/recommendations?storeId=${encodeURIComponent(query.storeId)}&date=${encodeURIComponent(query.date)}&mealType=${encodeURIComponent(query.mealType)}`,
    auth: true,
  });
}
