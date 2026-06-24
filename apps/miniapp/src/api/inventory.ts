import request from './request';

export interface InventoryItem {
  id: string;
  storeId: string;
  date: string;
  ingredients?: Array<{ ingredientId: string; name: string; quantity: number; unit: string }>;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function fetchInventories(query: { storeId: string; date?: string }) {
  return request<InventoryItem[]>({
    url: '/inventories',
    auth: true,
    data: query,
  });
}

export function fetchLatestInventory(storeId: string) {
  return request<InventoryItem>({
    url: '/inventories/latest',
    auth: true,
    data: { storeId },
  });
}

export function createInventory(data: Partial<InventoryItem>) {
  return request<InventoryItem>({
    url: '/inventories',
    method: 'POST',
    auth: true,
    data,
  });
}

export function updateInventory(id: string, data: Partial<InventoryItem>) {
  return request<InventoryItem>({
    url: `/inventories/${id}`,
    method: 'PATCH',
    auth: true,
    data,
  });
}
