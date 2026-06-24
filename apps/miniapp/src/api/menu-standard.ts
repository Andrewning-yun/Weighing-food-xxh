import request from './request';

export type MenuStandardMealType = 'breakfast' | 'lunch';

export interface MenuStandardItem {
  id?: string;
  storeId?: string;
  mealType?: MenuStandardMealType;
  category: string;
  targetCount: number;
  remark?: string;
}

export function fetchMenuStandards(storeId: string, mealType: MenuStandardMealType) {
  return request<MenuStandardItem[]>({
    url: `/menu-standards?storeId=${encodeURIComponent(storeId)}&mealType=${encodeURIComponent(mealType)}`,
    auth: true,
  });
}

export function updateMenuStandards(payload: {
  storeId: string;
  mealType: MenuStandardMealType;
  items: MenuStandardItem[];
}) {
  return request<MenuStandardItem[]>({
    url: '/menu-standards',
    method: 'PUT',
    auth: true,
    data: payload,
  });
}
