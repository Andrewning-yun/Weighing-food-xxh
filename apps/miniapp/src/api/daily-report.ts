import request from './request';

export type MealType = 'breakfast' | 'lunch';

export type LeftoverLevel = 'none' | 'low' | 'medium' | 'high';

export interface DailyMetricRecord {
  id: string;
  storeId: string;
  date: string;
  mealType: MealType;
  avgTicketPrice: number;
  customerCount: number;
  totalRevenue?: number;
  weather?: string;
  recordedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyMetricPayload {
  storeId: string;
  date: string;
  mealType: MealType;
  avgTicketPrice: number;
  customerCount: number;
  totalRevenue?: number;
  weather?: string;
}

export interface DishFeedbackRecord {
  id: string;
  storeId: string;
  date: string;
  mealType: MealType;
  dishId: string;
  dishName?: string;
  leftoverLevel: LeftoverLevel;
  note?: string;
  recordedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DishFeedbackPayload {
  storeId: string;
  date: string;
  mealType: MealType;
  dishId: string;
  leftoverLevel: LeftoverLevel;
  note?: string;
}

export function fetchDailyMetrics(query: { storeId: string; date?: string; mealType?: MealType }) {
  return request<DailyMetricRecord[]>({
    url: '/daily-metrics',
    auth: true,
    data: query,
  });
}

export function fetchLatestDailyMetric(storeId: string, mealType: MealType) {
  return request<DailyMetricRecord | null>({
    url: '/daily-metrics/latest',
    auth: true,
    data: { storeId, mealType },
  });
}

export function createDailyMetric(data: DailyMetricPayload) {
  return request<DailyMetricRecord>({
    url: '/daily-metrics',
    method: 'POST',
    auth: true,
    data,
  });
}

export function updateDailyMetric(id: string, data: Partial<DailyMetricPayload>) {
  return request<DailyMetricRecord>({
    url: `/daily-metrics/${id}`,
    method: 'PUT',
    auth: true,
    data,
  });
}

export function fetchDishFeedback(query: { storeId: string; date?: string; mealType?: MealType }) {
  return request<DishFeedbackRecord[]>({
    url: '/dish-feedback',
    auth: true,
    data: query,
  });
}

export function createDishFeedback(data: DishFeedbackPayload) {
  return request<DishFeedbackRecord>({
    url: '/dish-feedback',
    method: 'POST',
    auth: true,
    data,
  });
}

export function updateDishFeedback(id: string, data: Partial<DishFeedbackPayload>) {
  return request<DishFeedbackRecord>({
    url: `/dish-feedback/${id}`,
    method: 'PUT',
    auth: true,
    data,
  });
}

