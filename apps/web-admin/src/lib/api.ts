import {
  createApiClient,
  createApiRequest,
  type ApiDishRecord,
  type ApiIngredientRecord,
  type ApiStoreRecord,
  type ApiUserRecord,
} from '../../../../packages/api-client/index';
import {
  DEFAULT_USER_PASSWORD,
  mapApiRoleToUi,
  mapUiRoleToApi,
  normalizeCategory,
  normalizeNumber,
  normalizeStation,
  WEB_ADMIN_DEFAULT_API_BASE_URL,
  WEB_ADMIN_TOKEN_KEY,
  type UiRole,
} from '../../../../packages/config/index';

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: UiRole;
  storeId?: string;
  storeName?: string;
}

export interface LoginResult {
  token: string;
  user: SessionUser;
}

export interface IngredientRecord {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  cost: number;
  note: string;
  updatedAt: string;
  category?: string;
  perishable?: boolean;
  type?: 'main' | 'sub';
}

export interface DishIngredientDraft {
  ingredientId: string;
  quantity: number;
  unit: string;
  wasteRate: number;
}

export interface DishStepDraft {
  id: number;
  title: string;
  description: string;
  duration: number;
  station: string;
}

export interface DishRecord {
  id: string;
  name: string;
  category: string;
  station: string;
  description: string;
  coverImageUrl: string;
  ingredientCost: number;
  status: 'active' | 'draft';
  ingredientCount: number;
  ingredients: DishIngredientDraft[];
  steps: DishStepDraft[];
  updatedAt: string;
  mealType?: 'breakfast' | 'lunch';
  recommendWeight?: 1 | 2 | 3;
  relatedIngredients?: string;
  dishTypeTag?: '大荤' | '小荤' | '素菜' | '';
}

export interface DishAuditSubmission {
  auditSubmitted: true;
  auditId: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
}

export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  role: UiRole;
  status: 'active' | 'disabled';
  phone: string;
  updatedAt: string;
  storeId?: string;
  storeName?: string;
  wechatOpenId?: string;
}

export interface StoreRecord {
  id: string;
  name: string;
  code: string;
  city: string;
  status: 'open' | 'paused';
  manager: string;
  updatedAt: string;
  targetTicketPriceBreakfast?: number | null;
  targetTicketPriceLunch?: number | null;
  pricePerLiang?: number | null;
  memberPricePerLiang?: number | null;
  ricePrice?: number | null;
}

export interface IngredientDraft {
  id?: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  cost: number;
  note: string;
  category?: string;
  perishable?: boolean;
  type?: 'main' | 'sub';
}

export interface DishDraft {
  id?: string;
  name: string;
  category: string;
  station: string;
  description: string;
  coverImageUrl: string;
  ingredientCost: number;
  status: 'active' | 'draft';
  ingredientCount: number;
  ingredients: DishIngredientDraft[];
  steps: DishStepDraft[];
  mealType?: 'breakfast' | 'lunch';
  recommendWeight?: 1 | 2 | 3;
  relatedIngredients?: string;
  dishTypeTag?: '大荤' | '小荤' | '素菜' | '';
}

export interface UserDraft {
  id?: string;
  username: string;
  displayName: string;
  role: UiRole;
  status: 'active' | 'disabled';
  phone: string;
}

export interface StoreDraft {
  id?: string;
  name: string;
  code: string;
  city: string;
  status: 'open' | 'paused';
  manager: string;
  targetTicketPriceBreakfast?: number | null;
  targetTicketPriceLunch?: number | null;
  pricePerLiang?: number | null;
  memberPricePerLiang?: number | null;
  ricePrice?: number | null;
}

const API_BASE_URL = WEB_ADMIN_DEFAULT_API_BASE_URL;

function getToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(WEB_ADMIN_TOKEN_KEY) || '';
}

function parseBody(rawBody: string) {
  if (!rawBody.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

const request = createApiRequest({
  baseUrl: API_BASE_URL,
  getToken,
  onUnauthorized: () => clearToken(),
  execute: async ({ url, method, data, headers }) => {
    const response = await fetch(url, {
      method,
      headers,
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const rawBody = await response.text();
    return {
      status: response.status,
      body: parseBody(rawBody),
    };
  },
});

const api = createApiClient(request);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.body,
  }).then(async (response) => {
    const text = await response.text();

    if (response.status === 401) {
      clearToken();
    }

    if (!response.ok) {
      throw new Error(text || `Request failed (${response.status})`);
    }

    if (!text.trim()) {
      return undefined as unknown as T;
    }

    const payload: unknown = JSON.parse(text);

    if (!isRecord(payload)) {
      return payload as T;
    }

    if ('success' in payload && payload.success === false) {
      const message = typeof payload.message === 'string' ? payload.message : 'Request failed';
      throw new Error(message);
    }

    if ('data' in payload && payload.data !== undefined) {
      return payload.data as T;
    }

    return payload as T;
  });
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidate = payload.data ?? payload.items ?? payload.rows ?? payload.records;
  if (Array.isArray(candidate)) {
    return candidate as unknown as T[];
  }

  return [];
}

function mapSessionUser(user: {
  id: string;
  username: string;
  name: string;
  role: UiRole;
  storeId?: string;
  storeName?: string;
}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.name || user.username,
    role: mapApiRoleToUi(user.role),
    storeId: user.storeId,
    storeName: user.storeName,
  } satisfies SessionUser;
}

function mapIngredientRecord(record: ApiIngredientRecord): IngredientRecord {
  return {
    id: record.id,
    name: record.name,
    unit: record.unit,
    stock: 0,
    minStock: 0,
    cost: normalizeNumber(record.costPerUnit ?? record.price),
    note: record.spec || '',
    updatedAt: record.updatedAt,
    category: record.category || 'other',
    perishable: Boolean(record.perishable),
    type: (record.type as 'main' | 'sub' | undefined) || 'main',
  };
}

function mapDishRecord(record: ApiDishRecord): DishRecord {
  const ingredients = (record.ingredients || []).map((item) => ({
    ingredientId: item.ingredientId,
    quantity: normalizeNumber(item.quantity),
    unit: item.unit || 'kg',
    wasteRate: normalizeNumber(item.wasteRate),
  }));

  const steps = (record.steps || []).map((item, index) => ({
    id: Number(item.id || index + 1),
    title: item.title || `步骤 ${index + 1}`,
    description: item.description || '',
    duration: normalizeNumber(item.duration),
    station: item.station || record.station || 'wok',
  }));

  return {
    id: record.id,
    name: record.name,
    category: record.category,
    station: record.station || 'wok',
    description: record.description || '',
    coverImageUrl: record.coverImageUrl || '',
    ingredientCost: normalizeNumber(record.ingredientCost),
    status: record.isActive ? 'active' : 'draft',
    ingredientCount: ingredients.length,
    ingredients,
    steps,
    updatedAt: record.updatedAt,
    mealType: record.mealType,
    recommendWeight: record.recommendWeight,
    relatedIngredients: record.relatedIngredients,
    dishTypeTag: (record as ApiDishRecord & { dishTypeTag?: DishTypeTagValue }).dishTypeTag,
  };
}

function mapUserRecord(record: ApiUserRecord): UserRecord {
  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName || record.name || record.username,
    role: mapApiRoleToUi(record.role),
    status: 'active',
    phone: '',
    updatedAt: record.updatedAt,
    storeId: record.storeId,
    storeName: record.storeName,
    wechatOpenId: record.wechatOpenId,
  };
}

function mapStoreRecord(record: ApiStoreRecord): StoreRecord {
  const extended = record as ApiStoreRecord & {
    targetTicketPriceBreakfast?: number | null;
    targetTicketPriceLunch?: number | null;
    pricePerLiang?: number | null;
    memberPricePerLiang?: number | null;
    ricePrice?: number | null;
  };

  return {
    id: record.id,
    name: record.name,
    code: record.brandId || '',
    city: record.address || '',
    status: record.isActive === false ? 'paused' : 'open',
    manager: record.contactName || '',
    updatedAt: record.updatedAt,
    targetTicketPriceBreakfast: extended.targetTicketPriceBreakfast ?? null,
    targetTicketPriceLunch: extended.targetTicketPriceLunch ?? null,
    pricePerLiang: extended.pricePerLiang ?? null,
    memberPricePerLiang: extended.memberPricePerLiang ?? null,
    ricePrice: extended.ricePrice ?? null,
  };
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const data = await api.login({ username, password });
  return {
    token: data.token,
    user: mapSessionUser(data.user),
  };
}

export async function fetchCurrentUser(): Promise<SessionUser> {
  const data = await requestJson<{
    id: string;
    username: string;
    name: string;
    role: UiRole;
    storeId?: string;
    storeName?: string;
  }>('/auth/me');
  return mapSessionUser(data);
}

export async function fetchIngredients(): Promise<IngredientRecord[]> {
  const data = await api.fetchIngredients();
  return data.map(mapIngredientRecord);
}

export async function saveIngredient(draft: IngredientDraft): Promise<IngredientRecord> {
  const data = await api.saveIngredient({
    id: draft.id,
    name: draft.name,
    unit: draft.unit,
    price: draft.cost,
    costPerUnit: draft.cost,
    spec: draft.note,
    category: draft.category,
    perishable: draft.perishable,
    type: draft.type,
    isActive: true,
  });

  return mapIngredientRecord(data);
}

export async function removeIngredient(id: string): Promise<void> {
  await api.removeIngredient(id);
}

export async function fetchDishes(): Promise<DishRecord[]> {
  const data = await api.fetchDishes();
  return data.map(mapDishRecord);
}

export async function saveDish(draft: DishDraft): Promise<DishRecord | DishAuditSubmission> {
  const safeCost = Math.max(0, normalizeNumber(draft.ingredientCost));

  const data = await requestJson<ApiDishRecord | DishAuditSubmission>(draft.id ? `/dishes/${draft.id}` : '/dishes', {
    method: draft.id ? 'PATCH' : 'POST',
    body: JSON.stringify({
      id: draft.id,
      name: draft.name,
      category: normalizeCategory(draft.category),
      station: normalizeStation(draft.station),
      description: draft.description,
      coverImageUrl: draft.coverImageUrl,
      ingredients: draft.ingredients.map((item) => ({
        ingredientId: item.ingredientId,
        quantity: Math.max(0, normalizeNumber(item.quantity)),
        unit: item.unit,
        wasteRate: Math.max(0, normalizeNumber(item.wasteRate)),
      })),
      steps: draft.steps.map((item, index) => ({
        id: index + 1,
        title: item.title,
        description: item.description,
        duration: Math.max(0, normalizeNumber(item.duration)),
        station: normalizeStation(item.station || draft.station),
      })),
      ingredientCost: safeCost,
      isActive: draft.status === 'active',
      mealType: draft.mealType,
      recommendWeight: draft.recommendWeight,
      relatedIngredients: draft.relatedIngredients,
      dishTypeTag: draft.dishTypeTag || undefined,
    }),
  });

  if (data && typeof data === 'object' && 'auditSubmitted' in data) {
    return data as DishAuditSubmission;
  }
  return mapDishRecord(data as ApiDishRecord);
}

export async function removeDish(id: string): Promise<void> {
  await api.removeDish(id);
}

export async function fetchUsers(): Promise<UserRecord[]> {
  const data = await api.fetchUsers();
  return data.map(mapUserRecord);
}

export async function saveUser(draft: UserDraft): Promise<UserRecord> {
  const data = await api.saveUser({
    id: draft.id,
    username: draft.username,
    name: draft.displayName,
    role: mapUiRoleToApi(draft.role),
    password: draft.id ? undefined : DEFAULT_USER_PASSWORD,
  });

  return mapUserRecord(data);
}

export async function removeUser(id: string): Promise<void> {
  await api.removeUser(id);
}

export async function fetchStores(): Promise<StoreRecord[]> {
  const data = await requestJson<unknown>('/stores');
  const list = unwrapList<ApiStoreRecord>(data);
  if (list.length === 0 && Array.isArray(data)) {
    return (data as ApiStoreRecord[]).map(mapStoreRecord);
  }
  if (list.length === 0 && data && typeof data === 'object' && 'data' in data) {
    return unwrapList<ApiStoreRecord>((data as { data?: unknown }).data).map(mapStoreRecord);
  }
  if (list.length === 0) {
    return [];
  }
  return list.map(mapStoreRecord);
}

export async function saveStore(draft: StoreDraft): Promise<StoreRecord> {
  const data = await requestJson<ApiStoreRecord>(draft.id ? `/stores/${draft.id}` : '/stores', {
    method: draft.id ? 'PATCH' : 'POST',
    body: JSON.stringify({
      id: draft.id,
      name: draft.name,
      brandId: draft.code || 'demo-brand',
      address: draft.city,
      isActive: draft.status === 'open',
      contactName: draft.manager,
      targetTicketPriceBreakfast: draft.targetTicketPriceBreakfast ?? null,
      targetTicketPriceLunch: draft.targetTicketPriceLunch ?? null,
      pricePerLiang: draft.pricePerLiang ?? null,
      memberPricePerLiang: draft.memberPricePerLiang ?? null,
      ricePrice: draft.ricePrice ?? null,
    }),
  });

  return mapStoreRecord(data);
}

export async function removeStore(id: string): Promise<void> {
  await requestJson<void>(`/stores/${id}`, { method: 'DELETE' });
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(WEB_ADMIN_TOKEN_KEY, token);
  document.cookie = `${WEB_ADMIN_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(WEB_ADMIN_TOKEN_KEY);
  document.cookie = `${WEB_ADMIN_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/* ---------- P1 recommendation support ---------- */

export type MealTypeValue = 'breakfast' | 'lunch';
export type WeekdayValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type LeftoverLevelValue = 'none' | 'low' | 'medium' | 'high';
export type DishTypeTagValue = '大荤' | '小荤' | '素菜';

export interface DailyMetricRecord {
  id: string;
  storeId: string;
  storeName?: string;
  date: string;
  mealType: MealTypeValue;
  avgTicketPrice: number;
  customerCount: number;
  totalRevenue?: number | null;
  weather?: string | null;
  recordedBy?: string | null;
  recordedByName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyMetricDraft {
  id?: string;
  storeId: string;
  date: string;
  mealType: MealTypeValue;
  avgTicketPrice: number;
  customerCount: number;
  totalRevenue?: number | null;
  weather?: string | null;
}

export interface DailyMetricQuery {
  storeId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  mealType?: MealTypeValue;
}

export interface DishFeedbackRecord {
  id: string;
  storeId: string;
  storeName?: string;
  date: string;
  mealType: MealTypeValue;
  dishId: string;
  dishName?: string;
  leftoverLevel: LeftoverLevelValue;
  note?: string | null;
  recordedBy?: string | null;
  recordedByName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DishFeedbackDraft {
  id?: string;
  storeId: string;
  date: string;
  mealType: MealTypeValue;
  dishId: string;
  leftoverLevel: LeftoverLevelValue;
  note?: string | null;
}

export interface DishFeedbackQuery {
  storeId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  mealType?: MealTypeValue;
}

export interface MenuStandardRecord {
  id?: string;
  storeId: string;
  storeName?: string;
  mealType: MealTypeValue;
  categoryName: string;
  requiredCount: number;
  updatedAt?: string;
}

export interface MenuStandardDraft {
  storeId: string;
  mealType: MealTypeValue;
  categoryName: string;
  requiredCount: number;
}

export interface MenuStandardQuery {
  storeId?: string;
  mealType?: MealTypeValue;
}

export interface DefaultDishRecord {
  id?: string;
  storeId: string;
  storeName?: string;
  mealType: MealTypeValue;
  dayOfWeek: WeekdayValue;
  dishId: string;
  dishName?: string;
  updatedAt?: string;
}

export interface DefaultDishDraft {
  storeId: string;
  mealType: MealTypeValue;
  dayOfWeek: WeekdayValue;
  dishId: string;
}

export interface DefaultDishQuery {
  storeId?: string;
  mealType?: MealTypeValue;
  dayOfWeek?: WeekdayValue;
}

export interface AlgorithmTicketPriceConfig {
  deviationThreshold: number;
  lowTicketMeatBonus: number;
  lowTicketVegPenalty: number;
  highTicketHighMarginBonus: number;
  highTicketLowMarginPenalty: number;
  scaleCap: number;
}

export interface AlgorithmFreshnessConfig {
  lookbackDays: number;
  freshnessBonus: number;
  freshnessPenalty: number;
}

export interface AlgorithmProfitConfig {
  highMarginBalance: number;
  mediumMarginBalance: number;
  trafficBalance: number;
}

export interface AlgorithmDiversityConfig {
  perAttributeBonus: number;
  diversityPenalty: number;
}

export interface AlgorithmCategoryConfig {
  lowThreshold: number;
  lowBonus: number;
  highThreshold: number;
  highPenalty: number;
}

export interface AlgorithmFeedbackConfig {
  highLeftoverPenalty: number;
  mediumLeftoverPenalty: number;
  lowLeftoverBonus: number;
}

export interface AlgorithmOutputConfig {
  recommendLimit: number;
}

export interface AlgorithmConfigState {
  ticketPrice: AlgorithmTicketPriceConfig;
  freshness: AlgorithmFreshnessConfig;
  profit: AlgorithmProfitConfig;
  diversity: AlgorithmDiversityConfig;
  category: AlgorithmCategoryConfig;
  feedback: AlgorithmFeedbackConfig;
  output: AlgorithmOutputConfig;
}

export interface AlgorithmConfigQuery {
  storeId?: string;
}

export interface AlgorithmConfigUpdate {
  storeId: string;
  config: AlgorithmConfigState;
}

export interface DishTypeTagRule {
  relatedIngredients: string[];
  minMainIng: number;
}

export interface DishTypeTagRecord {
  id?: string;
  name: string;
  rules: DishTypeTagRule;
  sortOrder: number;
  updatedAt?: string;
}

export interface DishTypeTagDraft {
  id?: string;
  name: string;
  relatedIngredients: string;
  minMainIng: number;
  sortOrder: number;
}

export interface MenuPairingRuleRecord {
  id?: string;
  storeId: string;
  storeName?: string;
  mealType: MealTypeValue;
  tagName: string;
  minCount: number;
  maxCount?: number | null;
  updatedAt?: string;
}

export interface MenuPairingRuleDraft {
  storeId: string;
  mealType: MealTypeValue;
  tagName: string;
  minCount: number;
  maxCount?: number | null;
}

export interface MenuPairingRuleQuery {
  storeId?: string;
  mealType?: MealTypeValue;
}

export const DEFAULT_ALGORITHM_CONFIG: AlgorithmConfigState = {
  ticketPrice: {
    deviationThreshold: 0.1,
    lowTicketMeatBonus: 20,
    lowTicketVegPenalty: 10,
    highTicketHighMarginBonus: 15,
    highTicketLowMarginPenalty: 15,
    scaleCap: 3,
  },
  freshness: {
    lookbackDays: 7,
    freshnessBonus: 10,
    freshnessPenalty: -8,
  },
  profit: {
    highMarginBalance: 10,
    mediumMarginBalance: 8,
    trafficBalance: 5,
  },
  diversity: {
    perAttributeBonus: 8,
    diversityPenalty: -2,
  },
  category: {
    lowThreshold: 2,
    lowBonus: 5,
    highThreshold: 5,
    highPenalty: -3,
  },
  feedback: {
    highLeftoverPenalty: -15,
    mediumLeftoverPenalty: -8,
    lowLeftoverBonus: 5,
  },
  output: {
    recommendLimit: 20,
  },
};

export const DEFAULT_DISH_TYPE_TAGS: DishTypeTagRecord[] = [
  {
    name: '大荤',
    rules: {
      relatedIngredients: ['肉', '禽', '海鲜', '虾', '蟹', '贝壳', '牛肉'],
      minMainIng: 1,
    },
    sortOrder: 1,
  },
  {
    name: '小荤',
    rules: {
      relatedIngredients: ['肉末', '鸡蛋', '豆干', '鱼'],
      minMainIng: 0,
    },
    sortOrder: 2,
  },
  {
    name: '素菜',
    rules: {
      relatedIngredients: ['菜', '菇', '瓜', '豆', '根茎'],
      minMainIng: 0,
    },
    sortOrder: 3,
  },
];

function appendQueryParams(params: object) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

function buildArrayBody<T>(items: T[]) {
  return JSON.stringify(items);
}

export async function fetchDailyMetrics(query?: DailyMetricQuery): Promise<DailyMetricRecord[]> {
  const payload = await requestJson<unknown>(`/daily-metrics${appendQueryParams(query ?? {})}`);
  return unwrapList<DailyMetricRecord>(payload);
}

export async function getLatestDailyMetric(storeId: string, mealType?: MealTypeValue): Promise<DailyMetricRecord | null> {
  const payload = await requestJson<unknown>(
    `/daily-metrics/latest${appendQueryParams({ storeId, mealType })}`,
  );
  const list = unwrapList<DailyMetricRecord>(payload);
  if (list.length > 0) {
    return list[0];
  }
  if (payload && typeof payload === 'object' && 'id' in payload) {
    return payload as DailyMetricRecord;
  }
  return null;
}

export async function saveDailyMetric(draft: DailyMetricDraft): Promise<DailyMetricRecord> {
  const endpoint = draft.id ? `/daily-metrics/${draft.id}` : '/daily-metrics';
  const method = draft.id ? 'PUT' : 'POST';
  return requestJson<DailyMetricRecord>(endpoint, {
    method,
    body: JSON.stringify({
      id: draft.id,
      storeId: draft.storeId,
      date: draft.date,
      mealType: draft.mealType,
      avgTicketPrice: normalizeNumber(draft.avgTicketPrice),
      customerCount: Math.max(0, Math.round(normalizeNumber(draft.customerCount))),
      totalRevenue: draft.totalRevenue === undefined || draft.totalRevenue === null ? null : normalizeNumber(draft.totalRevenue),
      weather: draft.weather || null,
    }),
  });
}

export async function fetchDishFeedback(query?: DishFeedbackQuery): Promise<DishFeedbackRecord[]> {
  const payload = await requestJson<unknown>(`/dish-feedback${appendQueryParams(query ?? {})}`);
  return unwrapList<DishFeedbackRecord>(payload);
}

export async function saveDishFeedback(draft: DishFeedbackDraft): Promise<DishFeedbackRecord> {
  const endpoint = draft.id ? `/dish-feedback/${draft.id}` : '/dish-feedback';
  const method = draft.id ? 'PUT' : 'POST';
  return requestJson<DishFeedbackRecord>(endpoint, {
    method,
    body: JSON.stringify({
      id: draft.id,
      storeId: draft.storeId,
      date: draft.date,
      mealType: draft.mealType,
      dishId: draft.dishId,
      leftoverLevel: draft.leftoverLevel,
      note: draft.note || null,
    }),
  });
}

export async function fetchMenuStandards(query?: MenuStandardQuery): Promise<MenuStandardRecord[]> {
  const payload = await requestJson<unknown>(`/menu-standards${appendQueryParams(query ?? {})}`);
  return unwrapList<MenuStandardRecord>(payload);
}

export async function saveMenuStandards(items: MenuStandardDraft[]): Promise<MenuStandardRecord[]> {
  const storeId = items[0]?.storeId;
  const mealType = items[0]?.mealType;
  return requestJson<MenuStandardRecord[]>('/menu-standards', {
    method: 'PUT',
    body: JSON.stringify({
      storeId,
      mealType,
      items,
    }),
  });
}

export async function fetchDefaultDishes(query?: DefaultDishQuery): Promise<DefaultDishRecord[]> {
  const payload = await requestJson<unknown>(`/default-dishes${appendQueryParams(query ?? {})}`);
  return unwrapList<DefaultDishRecord>(payload);
}

export async function saveDefaultDishes(items: DefaultDishDraft[]): Promise<DefaultDishRecord[]> {
  const storeId = items[0]?.storeId;
  const mealType = items[0]?.mealType;
  const dayOfWeek = items[0]?.dayOfWeek;
  return requestJson<DefaultDishRecord[]>('/default-dishes', {
    method: 'PUT',
    body: JSON.stringify({
      storeId,
      mealType,
      dayOfWeek,
      items,
    }),
  });
}

export async function fetchAlgorithmConfig(query: AlgorithmConfigQuery): Promise<AlgorithmConfigState> {
  const payload = await requestJson<unknown>(`/algorithm-config${appendQueryParams(query)}`);
  if (payload && typeof payload === 'object' && 'config' in payload) {
    return { ...DEFAULT_ALGORITHM_CONFIG, ...(payload as { config?: Partial<AlgorithmConfigState> }).config };
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Partial<AlgorithmConfigState>;
    return {
      ticketPrice: { ...DEFAULT_ALGORITHM_CONFIG.ticketPrice, ...(record.ticketPrice || {}) },
      freshness: { ...DEFAULT_ALGORITHM_CONFIG.freshness, ...(record.freshness || {}) },
      profit: { ...DEFAULT_ALGORITHM_CONFIG.profit, ...(record.profit || {}) },
      diversity: { ...DEFAULT_ALGORITHM_CONFIG.diversity, ...(record.diversity || {}) },
      category: { ...DEFAULT_ALGORITHM_CONFIG.category, ...(record.category || {}) },
      feedback: { ...DEFAULT_ALGORITHM_CONFIG.feedback, ...(record.feedback || {}) },
      output: { ...DEFAULT_ALGORITHM_CONFIG.output, ...(record.output || {}) },
    };
  }

  return DEFAULT_ALGORITHM_CONFIG;
}

export async function saveAlgorithmConfig(payload: AlgorithmConfigUpdate): Promise<AlgorithmConfigState> {
  return requestJson<AlgorithmConfigState>('/algorithm-config', {
    method: 'PUT',
    body: JSON.stringify({
      storeId: payload.storeId,
      config: payload.config,
    }),
  });
}

export async function fetchDishTypeTags(): Promise<DishTypeTagRecord[]> {
  const payload = await requestJson<unknown>('/dish-type-tags');
  return unwrapList<DishTypeTagRecord>(payload);
}

export async function createDishTypeTag(payload: DishTypeTagDraft): Promise<DishTypeTagRecord> {
  return requestJson<DishTypeTagRecord>('/dish-type-tags', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      sortOrder: payload.sortOrder,
      rules: {
        relatedIngredients: payload.relatedIngredients
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        minMainIng: Math.max(0, Math.round(normalizeNumber(payload.minMainIng))),
      },
    }),
  });
}

export async function updateDishTypeTag(payload: DishTypeTagDraft): Promise<DishTypeTagRecord> {
  return requestJson<DishTypeTagRecord>(`/dish-type-tags/${payload.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: payload.name,
      sortOrder: payload.sortOrder,
      rules: {
        relatedIngredients: payload.relatedIngredients
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        minMainIng: Math.max(0, Math.round(normalizeNumber(payload.minMainIng))),
      },
    }),
  });
}

export async function removeDishTypeTag(id: string): Promise<void> {
  await requestJson<void>(`/dish-type-tags/${id}`, { method: 'DELETE' });
}

export async function fetchMenuPairingRules(query?: MenuPairingRuleQuery): Promise<MenuPairingRuleRecord[]> {
  const payload = await requestJson<unknown>(`/menu-pairing-rules${appendQueryParams(query ?? {})}`);
  return unwrapList<MenuPairingRuleRecord>(payload);
}

export async function saveMenuPairingRules(items: MenuPairingRuleDraft[]): Promise<MenuPairingRuleRecord[]> {
  const storeId = items[0]?.storeId;
  const mealType = items[0]?.mealType;
  return requestJson<MenuPairingRuleRecord[]>('/menu-pairing-rules', {
    method: 'PUT',
    body: JSON.stringify({
      storeId,
      mealType,
      items,
    }),
  });
}

/* ---------- Inventory ---------- */

export interface InventoryItem {
  ingredientId: string;
  ingredientName?: string;
  name?: string;
  quantity: number;
  unit: string;
  note?: string;
  category?: string;
  perishable?: boolean;
}

export interface InventoryRecord {
  id: string;
  date: string;
  storeId: string;
  storeName?: string;
  reporterId?: string;
  reporterName?: string;
  reportedBy?: string;
  items: InventoryItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryDraft {
  id?: string;
  date: string;
  storeId: string;
  items: InventoryItem[];
}

export interface InventoryQuery {
  storeId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listInventories(query?: InventoryQuery): Promise<InventoryRecord[]> {
  const params = new URLSearchParams();
  if (query?.storeId) params.set('storeId', query.storeId);
  if (query?.date) params.set('date', query.date);
  else if (query?.dateFrom) params.set('date', query.dateFrom);
  else if (query?.dateTo) params.set('date', query.dateTo);
  const qs = params.toString();
  const url = `${API_BASE_URL}/inventories${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) throw new Error(`Failed to list inventories (${res.status})`);
  const record = (await res.json()) as InventoryRecord;
  return record ? [record] : [];
}

export async function getLatestInventory(storeId: string): Promise<InventoryRecord | null> {
  const res = await fetch(`${API_BASE_URL}/inventories/latest?storeId=${storeId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to get latest inventory (${res.status})`);
  return res.json();
}

export async function createInventory(data: InventoryDraft): Promise<InventoryRecord> {
  const res = await fetch(`${API_BASE_URL}/inventories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create inventory (${res.status})`);
  return res.json();
}

export async function updateInventory(id: string, data: Partial<InventoryDraft>): Promise<InventoryRecord> {
  const res = await fetch(`${API_BASE_URL}/inventories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update inventory (${res.status})`);
  return res.json();
}

/* ---------- Menu Plans ---------- */

export interface MenuPlanDish {
  dishId: string;
  dishName: string;
  category: string;
  mealType: 'breakfast' | 'lunch';
  recommendWeight?: 1 | 2 | 3;
}

export interface MenuPlanRecord {
  id: string;
  date: string;
  storeId: string;
  storeName: string;
  mealType: 'breakfast' | 'lunch';
  dishes: MenuPlanDish[];
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuPlanDraft {
  id?: string;
  date: string;
  storeId: string;
  mealType: 'breakfast' | 'lunch';
  dishIds: string[];
  status?: 'draft' | 'published' | 'archived';
}

export interface MenuPlanQuery {
  storeId?: string;
  dateFrom?: string;
  dateTo?: string;
  mealType?: 'breakfast' | 'lunch';
  status?: string;
}

export async function listMenuPlans(query?: MenuPlanQuery): Promise<MenuPlanRecord[]> {
  const params = new URLSearchParams();
  if (query?.storeId) params.set('storeId', query.storeId);
  if (query?.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query?.dateTo) params.set('dateTo', query.dateTo);
  if (query?.mealType) params.set('mealType', query.mealType);
  if (query?.status) params.set('status', query.status);
  const qs = params.toString();
  const url = `${API_BASE_URL}/menu-plans${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`Failed to list menu plans (${res.status})`);
  return res.json();
}

export async function getMenuPlan(id: string): Promise<MenuPlanRecord> {
  const res = await fetch(`${API_BASE_URL}/menu-plans/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to get menu plan (${res.status})`);
  return res.json();
}

export async function createMenuPlan(data: MenuPlanDraft): Promise<MenuPlanRecord> {
  const res = await fetch(`${API_BASE_URL}/menu-plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create menu plan (${res.status})`);
  return res.json();
}

export async function updateMenuPlan(id: string, data: Partial<MenuPlanDraft>): Promise<MenuPlanRecord> {
  const res = await fetch(`${API_BASE_URL}/menu-plans/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update menu plan (${res.status})`);
  return res.json();
}

export async function publishMenuPlan(id: string): Promise<MenuPlanRecord> {
  const res = await fetch(`${API_BASE_URL}/menu-plans/${id}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to publish menu plan (${res.status})`);
  return res.json();
}

/* ---------- Operation Logs ---------- */

export interface OperationLogRecord {
  id: string;
  storeId?: string;
  operatorId?: string;
  operatorName?: string;
  operatedBy?: string;
  operatedByName?: string;
  module: string;
  action: string;
  targetId: string;
  targetName?: string;
  summary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

export interface OperationLogQuery {
  storeId?: string;
  module?: string;
  action?: string;
  operator?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OperationLogStats {
  totalLogs: number;
  byModule: Record<string, number>;
  byAction: Record<string, number>;
}

export async function listOperationLogs(query?: OperationLogQuery): Promise<OperationLogRecord[]> {
  const params = new URLSearchParams();
  if (query?.storeId) params.set('storeId', query.storeId);
  if (query?.module) params.set('module', query.module);
  if (query?.action) params.set('action', query.action);
  if (query?.operator) params.set('operatedBy', query.operator);
  if (query?.dateFrom) params.set('startDate', query.dateFrom);
  if (query?.dateTo) params.set('endDate', query.dateTo);
  const qs = params.toString();
  const url = `${API_BASE_URL}/operation-logs${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`Failed to list operation logs (${res.status})`);
  const payload = await res.json();
  return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : payload.data?.data || [];
}

export async function getOperationLogStats(storeId: string): Promise<OperationLogStats> {
  const res = await fetch(`${API_BASE_URL}/operation-logs/stats?storeId=${storeId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to get operation log stats (${res.status})`);
  const payload = await res.json();
  const data = (payload?.data as Record<string, unknown>) || payload;
  const byModule = Object.fromEntries(
    ((data.byModule as Array<{ module: string; count: number }>) || []).map(
      (item: { module: string; count: number }) => [
        item.module,
        Number(item.count || 0),
      ],
    ),
  ) as Record<string, number>;
  return {
    totalLogs: Object.values(byModule).reduce((sum, count) => sum + count, 0),
    byModule,
    byAction: {},
  };
}

/* ---------- Audit ---------- */

export interface AuditRecord {
  id: string;
  storeId: string;
  module: string;
  action: string;
  targetId: string;
  targetName?: string | null;
  operatedBy: string;
  operatedByName: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditQuery {
  storeId: string;
  module?: string;
  status?: string;
  action?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface AuditListResult {
  data: AuditRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditStats {
  byStatus: Array<{ status: string; count: number }>;
  byModule: Array<{ module: string; count: number }>;
}

export async function listAuditRecords(query: AuditQuery): Promise<AuditListResult> {
  return requestJson<AuditListResult>(`/audit${appendQueryParams(query)}`);
}

export async function getAuditStats(storeId: string): Promise<AuditStats> {
  return requestJson<AuditStats>(`/audit/stats${appendQueryParams({ storeId })}`);
}

export async function approveAuditRecord(id: string): Promise<AuditRecord> {
  return requestJson<AuditRecord>(`/audit/${id}/approve`, { method: 'PATCH' });
}

export async function rejectAuditRecord(id: string, rejectReason: string): Promise<AuditRecord> {
  return requestJson<AuditRecord>(`/audit/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejectReason }),
  });
}

/* ---------- Data Import ---------- */

export type DataImportType = 'dish' | 'ingredient';
export type DataImportMode = 'merge' | 'replace' | 'skip_duplicate';

export interface DataImportItemPreview {
  index: number;
  status: 'valid' | 'invalid';
  errors?: string[];
  item: Record<string, unknown>;
}

export interface DataImportParseResult {
  type: DataImportType;
  mode: DataImportMode;
  total: number;
  validCount: number;
  invalidCount: number;
  items: DataImportItemPreview[];
}

export interface DataImportExecuteResult {
  type: DataImportType;
  mode: DataImportMode;
  created: number;
  updated: number;
  skipped: number;
}

export async function parseDataImportExcel(
  file: File,
  type: DataImportType,
  mode: DataImportMode,
): Promise<DataImportParseResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  formData.append('mode', mode);
  const res = await fetch('/api/data-import/parse', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '解析失败' }));
    throw new Error(err.message || err.error || '解析失败');
  }
  const json = await res.json();
  return json.data || json;
}

export async function executeDataImport(payload: {
  type: DataImportType;
  mode: DataImportMode;
  items: Record<string, unknown>[];
}): Promise<DataImportExecuteResult> {
  return requestJson<DataImportExecuteResult>('/data-import/execute', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* ---------- Analysis ---------- */

export interface AnalysisQuery {
  storeId: string;
  startDate: string;
  endDate: string;
  mealType?: MealTypeValue;
}

export interface IngredientUsageAnalysisItem {
  ingredientId: string;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  dishCount: number;
}

export interface DishFrequencyAnalysisItem {
  dishId: string;
  dishName: string;
  count: number;
  mealType?: MealTypeValue;
  category?: string;
}

export interface ProfitDistributionAnalysisItem {
  level: string;
  count: number;
  percentage: number;
}

export interface CategoryDistributionAnalysisItem {
  category: string;
  count: number;
  percentage: number;
}

function extractItems<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as unknown as T[];
  if (!isRecord(result)) return [];
  return Array.isArray(result.items) ? (result.items as unknown as T[]) : [];
}

export async function getIngredientUsageAnalysis(query: AnalysisQuery): Promise<IngredientUsageAnalysisItem[]> {
  const result = await requestJson<IngredientUsageAnalysisItem[]>(
    `/costing/analysis/ingredient-usage${appendQueryParams(query)}`,
  );
  return extractItems<IngredientUsageAnalysisItem>(result);
}

export async function getDishFrequencyAnalysis(query: AnalysisQuery): Promise<DishFrequencyAnalysisItem[]> {
  const result = await requestJson<DishFrequencyAnalysisItem[]>(
    `/costing/analysis/dish-frequency${appendQueryParams(query)}`,
  );
  return extractItems<DishFrequencyAnalysisItem>(result);
}

export async function getProfitDistributionAnalysis(query: AnalysisQuery): Promise<ProfitDistributionAnalysisItem[]> {
  const result = await requestJson<ProfitDistributionAnalysisItem[]>(
    `/costing/analysis/profit-distribution${appendQueryParams(query)}`,
  );
  return extractItems<ProfitDistributionAnalysisItem>(result);
}

export async function getCategoryDistributionAnalysis(query: AnalysisQuery): Promise<CategoryDistributionAnalysisItem[]> {
  const result = await requestJson<CategoryDistributionAnalysisItem[]>(
    `/costing/analysis/category-distribution${appendQueryParams(query)}`,
  );
  return extractItems<CategoryDistributionAnalysisItem>(result);
}


