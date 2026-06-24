import type {
  ApiRole,
  MealTypeValue,
  MenuPlanStatusValue,
  RecommendWeightValue,
  TaskSourceValue,
  TaskStatusValue,
} from '../config/index';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

export interface RequestExecutionResult {
  status: number;
  body?: unknown;
}

export interface CreateRequestOptions {
  baseUrl: string;
  getToken?: () => string;
  onUnauthorized?: () => void;
  execute: (input: {
    url: string;
    method: NonNullable<ApiRequestOptions['method']>;
    data?: unknown;
    headers: Record<string, string>;
  }) => Promise<RequestExecutionResult>;
}

export type ApiRequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;
export type ApiRequestInit = ApiRequestOptions;
export type ApiTransportResponse = RequestExecutionResult;

export interface AuthProfile {
  id: string;
  username: string;
  name: string;
  role: ApiRole;
  storeId?: string;
  storeName?: string;
  wechatOpenId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthLoginResponse {
  token: string;
  user: AuthProfile;
}

export interface ApiIngredientRecord {
  id: string;
  name: string;
  unit: string;
  price: number;
  costPerUnit?: number;
  supplier?: string;
  spec?: string;
  isActive?: boolean;
  category?: string;
  perishable?: boolean;
  type?: 'main' | 'sub';
  updatedAt: string;
}

export interface ApiDishIngredientRecord {
  ingredientId: string;
  quantity: number;
  unit: string;
  wasteRate: number;
}

export interface ApiDishStepRecord {
  id: number;
  title: string;
  description: string;
  duration?: number;
  station?: string;
  imageUrl?: string;
}

export interface ApiDishRecord {
  id: string;
  name: string;
  category: string;
  station: string;
  description?: string;
  coverImageUrl?: string;
  ingredientCost: number;
  isActive: boolean;
  mealType?: MealTypeValue;
  recommendWeight?: RecommendWeightValue;
  relatedIngredients?: string;
  ingredients?: ApiDishIngredientRecord[];
  steps?: ApiDishStepRecord[];
  updatedAt: string;
}

export interface ApiUserRecord {
  id: string;
  username: string;
  name?: string;
  displayName?: string;
  role: ApiRole;
  storeId?: string;
  storeName?: string;
  wechatOpenId?: string;
  updatedAt: string;
}

export interface ApiStoreRecord {
  id: string;
  name: string;
  brandId?: string;
  address?: string;
  isActive?: boolean;
  contactName?: string;
  updatedAt: string;
}

export interface IngredientMutation {
  id?: string;
  name: string;
  unit: string;
  price: number;
  costPerUnit?: number;
  spec?: string;
  isActive?: boolean;
  category?: string;
  perishable?: boolean;
  type?: 'main' | 'sub';
}

export interface DishMutation {
  id?: string;
  name: string;
  category: string;
  station: string;
  description?: string;
  coverImageUrl?: string;
  ingredients: ApiDishIngredientRecord[];
  steps: ApiDishStepRecord[];
  ingredientCost: number;
  isActive: boolean;
  mealType?: MealTypeValue;
  recommendWeight?: RecommendWeightValue;
  relatedIngredients?: string;
}

export interface UserMutation {
  id?: string;
  username: string;
  name: string;
  role: ApiRole;
  password?: string;
  storeId?: string;
}

export interface StoreMutation {
  id?: string;
  name: string;
  brandId: string;
  address?: string;
  isActive: boolean;
  contactName?: string;
}

export interface InventoryItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  perishable: boolean;
}

export interface InventoryRecord {
  id: string;
  storeId: string;
  date: string;
  items: InventoryItem[];
  reportedBy: string;
  createdAt: string;
}

export type ApiDailyInventoryRecord = InventoryRecord;

export interface InventoryMutation {
  storeId: string;
  date: string;
  items: InventoryItem[];
}

export interface InventoryQuery {
  storeId?: string;
  date?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export interface MenuPlanDish {
  dishId: string;
  overrideQty?: number;
  isActive?: boolean;
  dishName?: string;
}

export interface MenuPlanRecord {
  id: string;
  storeId: string;
  date: string;
  mealType: MealTypeValue;
  dishes: MenuPlanDish[];
  status: MenuPlanStatusValue;
  createdBy: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApiMenuPlanRecord = MenuPlanRecord;

export interface MenuPlanMutation {
  storeId: string;
  date: string;
  mealType: MealTypeValue;
  dishes: MenuPlanDish[];
}

export interface MenuPlanQuery {
  storeId?: string;
  date?: string;
  mealType?: MealTypeValue;
  status?: MenuPlanStatusValue;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export interface TaskItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface TaskRecord {
  id: string;
  storeId: string;
  date: string;
  mealType: MealTypeValue;
  source: TaskSourceValue;
  title: string;
  items: TaskItem[];
  assignedTo?: string;
  status: TaskStatusValue;
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
}

export type ApiTaskRecord = TaskRecord;

export interface TaskMutation {
  storeId: string;
  date: string;
  mealType: MealTypeValue;
  title: string;
  items: TaskItem[];
  assignedTo?: string;
  status?: TaskStatusValue;
}

export interface TaskStatusMutation {
  status: TaskStatusValue;
  assignedTo?: string;
}

export interface TaskQuery {
  storeId?: string;
  date?: string;
  mealType?: MealTypeValue;
  status?: TaskStatusValue;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export interface GenerateTasksPayload {
  storeId: string;
  date: string;
  mealType: MealTypeValue;
}

export interface DishRecommendationRecord {
  dishId: string;
  name: string;
  category: string;
  score: number;
  reasons: string[];
  recommendWeight: RecommendWeightValue;
  inventoryStatus: 'in_stock_perishable' | 'in_stock' | 'no_stock';
}

export type ApiDishRecommendation = DishRecommendationRecord;

export interface RecommendationQuery {
  storeId?: string;
  date?: string;
  mealType?: MealTypeValue;
}

export interface OperationLogRecord {
  id: string;
  storeId: string;
  operatedBy: string;
  operatedByName: string;
  module: string;
  action: string;
  targetId: string;
  targetName?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  summary?: string | null;
  createdAt: string;
}

export type ApiOperationLogRecord = OperationLogRecord;

export interface OperationLogQuery {
  storeId?: string;
  module?: string;
  action?: string;
  operatedBy?: string;
  operator?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export interface OperationLogStats {
  totalActions: number;
  byModule: Record<string, number>;
  byAction: Record<string, number>;
}

function readErrorMessage(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }
  }

  return 'Request failed';
}

function normalizeQueryParams(params: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...params };

  if (normalized.limit === undefined && normalized.pageSize !== undefined) {
    normalized.limit = normalized.pageSize;
  }

  if (normalized.operatedBy === undefined && typeof normalized.operator === 'string') {
    normalized.operatedBy = normalized.operator;
  }

  return normalized;
}

function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  const normalized = normalizeQueryParams(params);

  for (const [key, value] of Object.entries(normalized)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export function createApiRequest(options: CreateRequestOptions): ApiRequestFn {
  return async function request<T>(path: string, requestOptions: ApiRequestOptions = {}) {
    const headers = { ...(requestOptions.headers || {}) };

    if (!headers['Content-Type'] && requestOptions.data !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (requestOptions.auth !== false) {
      const token = options.getToken?.();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const result = await options.execute({
      url: `${options.baseUrl}${path}`,
      method: requestOptions.method || 'GET',
      data: requestOptions.data,
      headers,
    });

    if (result.status === 401) {
      options.onUnauthorized?.();
    }

    if (result.status < 200 || result.status >= 300) {
      throw new Error(readErrorMessage(result.body));
    }

    if (result.body === undefined || result.body === null || result.body === '') {
      return undefined as T;
    }

    const envelope = result.body as Partial<ApiEnvelope<T>>;

    if (typeof envelope === 'object' && envelope && 'success' in envelope) {
      if (envelope.success === false) {
        throw new Error(readErrorMessage(envelope));
      }

      return envelope.data as T;
    }

    return result.body as T;
  };
}

export function createApiClient(request: ApiRequestFn) {
  const listIngredients = () => request<ApiIngredientRecord[]>('/ingredients');
  const listDishes = () => request<ApiDishRecord[]>('/dishes');
  const listUsers = () => request<ApiUserRecord[]>('/users');
  const listStores = () => request<ApiStoreRecord[]>('/stores');

  return {
    login(payload: LoginPayload) {
      return request<AuthLoginResponse>('/auth/login', {
        method: 'POST',
        data: payload,
        auth: false,
      });
    },
    fetchSessionProfile() {
      return request<AuthProfile>('/auth/me');
    },
    me() {
      return request<AuthProfile>('/auth/me');
    },
    fetchIngredients: listIngredients,
    listIngredients,
    saveIngredient(payload: IngredientMutation) {
      return request<ApiIngredientRecord>(payload.id ? `/ingredients/${payload.id}` : '/ingredients', {
        method: payload.id ? 'PATCH' : 'POST',
        data: payload,
      });
    },
    removeIngredient(id: string) {
      return request<void>(`/ingredients/${id}`, { method: 'DELETE' });
    },
    fetchDishes: listDishes,
    listDishes,
    fetchDish(id: string) {
      return request<ApiDishRecord>(`/dishes/${id}`);
    },
    saveDish(payload: DishMutation) {
      return request<ApiDishRecord>(payload.id ? `/dishes/${payload.id}` : '/dishes', {
        method: payload.id ? 'PATCH' : 'POST',
        data: payload,
      });
    },
    removeDish(id: string) {
      return request<void>(`/dishes/${id}`, { method: 'DELETE' });
    },
    fetchUsers: listUsers,
    listUsers,
    saveUser(payload: UserMutation) {
      return request<ApiUserRecord>(payload.id ? `/users/${payload.id}` : '/users', {
        method: payload.id ? 'PATCH' : 'POST',
        data: payload,
      });
    },
    removeUser(id: string) {
      return request<void>(`/users/${id}`, { method: 'DELETE' });
    },
    fetchStores: listStores,
    listStores,
    saveStore(payload: StoreMutation) {
      return request<ApiStoreRecord>(payload.id ? `/stores/${payload.id}` : '/stores', {
        method: payload.id ? 'PATCH' : 'POST',
        data: payload,
      });
    },
    removeStore(id: string) {
      return request<void>(`/stores/${id}`, { method: 'DELETE' });
    },
    inventory: {
      listInventories(query: InventoryQuery) {
        return request<ApiDailyInventoryRecord[]>(`/inventories${buildQueryString(query as Record<string, unknown>)}`);
      },
      fetchInventories(query: InventoryQuery) {
        return request<ApiDailyInventoryRecord[]>(`/inventories${buildQueryString(query as Record<string, unknown>)}`);
      },
      getLatestInventory(storeId: string) {
        return request<ApiDailyInventoryRecord>(`/inventories/latest?storeId=${encodeURIComponent(storeId)}`);
      },
      createInventory(data: InventoryMutation) {
        return request<ApiDailyInventoryRecord>('/inventories', {
          method: 'POST',
          data,
        });
      },
      updateInventory(id: string, data: InventoryMutation) {
        return request<ApiDailyInventoryRecord>(`/inventories/${id}`, {
          method: 'PATCH',
          data,
        });
      },
    },
    menuPlans: {
      listMenuPlans(query: MenuPlanQuery) {
        return request<ApiMenuPlanRecord[]>(`/menu-plans${buildQueryString(query as Record<string, unknown>)}`);
      },
      fetchMenuPlans(query: MenuPlanQuery) {
        return request<ApiMenuPlanRecord[]>(`/menu-plans${buildQueryString(query as Record<string, unknown>)}`);
      },
      getMenuPlan(id: string) {
        return request<ApiMenuPlanRecord>(`/menu-plans/${id}`);
      },
      createMenuPlan(data: MenuPlanMutation) {
        return request<ApiMenuPlanRecord>('/menu-plans', {
          method: 'POST',
          data,
        });
      },
      updateMenuPlan(id: string, data: MenuPlanMutation) {
        return request<ApiMenuPlanRecord>(`/menu-plans/${id}`, {
          method: 'PATCH',
          data,
        });
      },
      publishMenuPlan(id: string) {
        return request<ApiMenuPlanRecord>(`/menu-plans/${id}/publish`, {
          method: 'POST',
        });
      },
    },
    tasks: {
      listTasks(query: TaskQuery) {
        return request<ApiTaskRecord[]>(`/tasks${buildQueryString(query as Record<string, unknown>)}`);
      },
      fetchTasks(query: TaskQuery) {
        return request<ApiTaskRecord[]>(`/tasks${buildQueryString(query as Record<string, unknown>)}`);
      },
      createTask(data: TaskMutation) {
        return request<ApiTaskRecord>('/tasks', {
          method: 'POST',
          data,
        });
      },
      updateTaskStatus(id: string, data: TaskStatusMutation) {
        return request<ApiTaskRecord>(`/tasks/${id}`, {
          method: 'PATCH',
          data,
        });
      },
      updateTask(id: string, data: TaskMutation | TaskStatusMutation) {
        return request<ApiTaskRecord>(`/tasks/${id}`, {
          method: 'PATCH',
          data,
        });
      },
      generateTasksFromMenu(data: GenerateTasksPayload) {
        return request<ApiTaskRecord[]>('/tasks/generate-from-menu', {
          method: 'POST',
          data,
        });
      },
      generateFromMenu(data: GenerateTasksPayload) {
        return request<ApiTaskRecord[]>('/tasks/generate-from-menu', {
          method: 'POST',
          data,
        });
      },
    },
    recommendations: {
      getRecommendations(query: RecommendationQuery) {
        return request<ApiDishRecommendation[]>(`/costing/recommendations${buildQueryString(query as Record<string, unknown>)}`);
      },
      fetchRecommendations(query: RecommendationQuery) {
        return request<ApiDishRecommendation[]>(`/costing/recommendations${buildQueryString(query as Record<string, unknown>)}`);
      },
    },
    operationLogs: {
      listOperationLogs(query: OperationLogQuery) {
        return request<ApiOperationLogRecord[]>(`/operation-logs${buildQueryString(query as Record<string, unknown>)}`);
      },
      fetchOperationLogs(query: OperationLogQuery) {
        return request<ApiOperationLogRecord[]>(`/operation-logs${buildQueryString(query as Record<string, unknown>)}`);
      },
      getOperationLogStats(storeId: string) {
        return request<OperationLogStats>(`/operation-logs/stats?storeId=${encodeURIComponent(storeId)}`);
      },
      fetchOperationLogStats(storeId: string) {
        return request<OperationLogStats>(`/operation-logs/stats?storeId=${encodeURIComponent(storeId)}`);
      },
    },
  };
}

export const createKitchenApiClient = createApiClient;
