import request from './request';

export interface IngredientSummary {
  id: string;
  name: string;
  category?: string;
  unit?: string;
  type?: string;
  price?: number;
  isPerishable?: boolean;
}

export function fetchIngredients() {
  return request<IngredientSummary[]>({
    url: '/ingredients',
    auth: true,
  });
}
