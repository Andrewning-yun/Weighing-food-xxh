import request from './request';

export interface Recommendation {
  id: string;
  storeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch';
  dishes?: Array<{
    dishId: string;
    dishName: string;
    ingredientCost: number;
    estimatedMargin: number;
    recommendWeight?: 1 | 2 | 3;
    inventoryStatus?: string;
    score?: number;
    reasons?: string[];
  }>;
  createdAt?: string;
}

export function fetchRecommendations(query: { storeId: string; date?: string; mealType?: string }) {
  return request<Recommendation[]>({
    url: '/costing/recommendations',
    auth: true,
    data: query,
  });
}
