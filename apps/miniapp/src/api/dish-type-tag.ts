import request from './request';

export interface DishTypeTagRecord {
  id: string;
  name: string;
  sortOrder?: number;
  rules?: {
    relatedIngredients?: string[];
    minMainIng?: number;
  };
}

export function fetchDishTypeTags() {
  return request<DishTypeTagRecord[]>({
    url: '/dish-type-tags',
    auth: true,
  });
}
