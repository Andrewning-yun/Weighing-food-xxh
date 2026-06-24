import request from './request';

export interface Task {
  id: string;
  storeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch';
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  assigneeId?: string;
  assigneeName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function fetchTasks(query: { storeId: string; date?: string; mealType?: string }) {
  return request<Task[]>({
    url: '/tasks',
    auth: true,
    data: query,
  });
}

export function createTask(data: Partial<Task>) {
  return request<Task>({
    url: '/tasks',
    method: 'POST',
    auth: true,
    data,
  });
}

export function updateTask(id: string, data: Partial<Task>) {
  return request<Task>({
    url: `/tasks/${id}`,
    method: 'PATCH',
    auth: true,
    data,
  });
}

export function generateTasksFromMenu(data: { storeId: string; date: string; mealType: string }) {
  return request<Task[]>({
    url: '/tasks/generate-from-menu',
    method: 'POST',
    auth: true,
    data,
  });
}
