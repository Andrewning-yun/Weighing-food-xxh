import request from './request';

export interface SupplementaryOrder {
  id: string;
  storeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch';
  menuPlanId: string;
  dishId: string;
  dishName: string;
  station: string;
  userId: string;
  userName: string;
  reason: string | null;
  estimatedQuantity: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplementaryOrderInput {
  menuPlanId: string;
  dishId: string;
  dishName: string;
  reason?: string;
  estimatedQuantity?: number;
}

export function fetchSupplementaryOrders(query: { menuPlanId: string }) {
  return request<SupplementaryOrder[]>({
    url: '/supplementary-orders',
    auth: true,
    data: query,
  });
}

export function fetchSupplementaryOrdersByDate(query: { date: string; storeId?: string }) {
  return request<SupplementaryOrder[]>({
    url: '/supplementary-orders/by-date',
    auth: true,
    data: query,
  });
}

export function createSupplementaryOrder(data: CreateSupplementaryOrderInput) {
  return request<SupplementaryOrder>({
    url: '/supplementary-orders',
    method: 'POST',
    auth: true,
    data,
  });
}

export function deleteSupplementaryOrder(id: string) {
  return request<{ id: string }>({
    url: `/supplementary-orders/${id}`,
    method: 'DELETE',
    auth: true,
  });
}
