import request from './request';

export interface MenuPlanDish {
  dishId: string;
  dishName?: string;
  quantity: number;
}

export interface MenuPlanScoreDimension {
  key?: string;
  label?: string;
  score: number;
  maxScore?: number;
  description?: string;
}

export interface MenuPlanScoreSummary {
  total?: number;
  completeness?: number;
  diversity?: number;
  freshness?: number;
  grossMargin?: number;
  dimensions?: MenuPlanScoreDimension[];
}

export interface MenuPairingGap {
  tagName: string;
  currentCount: number;
  minCount: number;
  maxCount?: number;
  gap?: number;
  description?: string;
}

export interface MenuPlan {
  id: string;
  storeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch';
  dishes?: MenuPlanDish[];
  status?: 'draft' | 'published';
  publishedAt?: string;
  menuScore?: MenuPlanScoreSummary;
  score?: number;
  pairingGaps?: MenuPairingGap[];
  createdAt?: string;
  updatedAt?: string;
}

export function fetchMenuPlans(query: { storeId: string; date?: string; mealType?: string }) {
  return request<MenuPlan[]>({
    url: '/menu-plans',
    auth: true,
    data: query,
  });
}

export function fetchMenuPlan(id: string) {
  return request<MenuPlan>({
    url: `/menu-plans/${id}`,
    auth: true,
  });
}

export function createMenuPlan(data: Partial<MenuPlan>) {
  return request<MenuPlan>({
    url: '/menu-plans',
    method: 'POST',
    auth: true,
    data,
  });
}

export function updateMenuPlan(id: string, data: Partial<MenuPlan>) {
  return request<MenuPlan>({
    url: `/menu-plans/${id}`,
    method: 'PATCH',
    auth: true,
    data,
  });
}

export function publishMenuPlan(id: string) {
  return request<MenuPlan>({
    url: `/menu-plans/${id}/publish`,
    method: 'POST',
    auth: true,
  });
}
