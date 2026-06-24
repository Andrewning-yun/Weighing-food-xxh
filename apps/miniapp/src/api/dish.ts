import request from './request';

export interface DishSummary {
  id: string;
  name: string;
  category: string;
  station: string;
  mealType?: 'breakfast' | 'lunch';
  recommendWeight?: 1 | 2 | 3;
  dishTypeTag?: string;
  description?: string;
  coverImageUrl?: string;
  ingredientCost?: number;
  isActive?: boolean;
  relatedIngredients?: string;
  ingredients?: Array<{ ingredientId: string; quantity: number; unit: string; wasteRate: number }>;
  steps?: Array<{ id: number; title: string; description: string; duration?: number; station?: string }>;
  updatedAt?: string;
}

export interface DishDetail extends DishSummary {
  ingredients: Array<{ ingredientId: string; quantity: number; unit: string; wasteRate: number }>;
  steps: Array<{ id: number; title: string; description: string; duration?: number; station?: string }>;
}

export interface DishPayload {
  name: string;
  category: string;
  station: string;
  description?: string;
  mealType?: 'breakfast' | 'lunch';
  recommendWeight?: number;
  relatedIngredients?: string;
  dishTypeTag?: string;
  isActive?: boolean;
  ingredients: Array<{ ingredientId: string; quantity: number; unit: string; wasteRate: number }>;
  steps: Array<{ id: number; title: string; description: string; duration?: number; station?: string }>;
}

export interface DishAuditSubmission {
  auditSubmitted: true;
  auditId: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
}

export function fetchDishes() {
  return request<DishSummary[]>({
    url: '/dishes',
    auth: true,
  });
}

export function fetchDish(id: string) {
  return request<DishDetail>({
    url: `/dishes/${id}`,
    auth: true,
  });
}

export function createDish(payload: DishPayload) {
  return request<DishDetail | DishAuditSubmission>({
    url: '/dishes',
    method: 'POST',
    auth: true,
    data: payload,
  });
}

export function updateDish(id: string, payload: Partial<DishPayload>) {
  return request<DishDetail | DishAuditSubmission>({
    url: `/dishes/${id}`,
    method: 'PATCH',
    auth: true,
    data: payload,
  });
}
