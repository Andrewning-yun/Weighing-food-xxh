export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000/api';
export const WEB_ADMIN_DEFAULT_API_BASE_URL = '/api';
export const MINIAPP_DEFAULT_API_BASE_URL = DEFAULT_API_BASE_URL;

export const WEB_ADMIN_TOKEN_KEY = 'web-admin-token';
export const MINIAPP_TOKEN_KEY = 'token';
export const MINIAPP_SESSION_USER_KEY = 'session-user';

export const DEFAULT_USER_PASSWORD = 'changeme123';

export const DishCategory = {
  RICE: 'rice',
  STEAM: 'steam',
  GRIDDLE: 'griddle',
  FRY: 'fry',
  PREP: 'prep',
  MEAT: 'meat',
  VEGETABLE: 'vegetable',
  SOUP: 'soup',
  PAN_FRY: 'panfry',
  CASSEROLE: 'casserole',
  STIR_FRY: 'stir',
  FRUIT: 'fruit',
  COLD: 'cold',
  TEA: 'tea',
  PORRIDGE: 'porridge',
  PASTRY: 'pastry',
  BREAKFAST_DRINK: 'breakfast_drink',
} as const;

export type DishCategoryValue = (typeof DishCategory)[keyof typeof DishCategory];

export const CATEGORY_OPTIONS = Object.values(DishCategory);

export const Station = {
  WOK: 'wok',
  GRILL_FRY_STEAM: 'grill_fry_steam',
  PREP: 'prep',
  BREAKFAST_WOK: 'breakfast_wok',
  BREAKFAST_ASSIST: 'breakfast_assist',
} as const;

export type StationValue = (typeof Station)[keyof typeof Station];

export const STATION_OPTIONS = Object.values(Station);

export const ApiRole = {
  ADMIN: 'admin',
  CHEF_MANAGER: 'chef_manager',
  CHEF: 'chef',
  PREP: 'prep',
  BREAKFAST_CHEF: 'breakfast_chef',
  BREAKFAST_ASSISTANT: 'breakfast_assistant',
  BUYER: 'buyer',
  STORE_MANAGER: 'store_manager',
} as const;

export type ApiRole = (typeof ApiRole)[keyof typeof ApiRole];

export const UiRole = { ...ApiRole } as const;

export type UiRole = (typeof UiRole)[keyof typeof UiRole];

export const ApiRoleLabels: Record<ApiRole, string> = {
  admin: '管理员',
  chef_manager: '后厨经理',
  chef: '厨师',
  prep: '切配',
  breakfast_chef: '早餐师傅',
  breakfast_assistant: '早餐帮工',
  buyer: '采购',
  store_manager: '店长',
};

export const ApiRoleOptions = Object.values(ApiRole).map((value) => ({
  value,
  label: ApiRoleLabels[value],
})) as Array<{ value: ApiRole; label: string }>;

export const UiRoleOptions = [...ApiRoleOptions] as Array<{ value: UiRole; label: string }>;

export const API_ROLE_TO_UI_ROLE: Record<ApiRole, UiRole> = {
  admin: UiRole.ADMIN,
  chef_manager: UiRole.CHEF_MANAGER,
  chef: UiRole.CHEF,
  prep: UiRole.PREP,
  breakfast_chef: UiRole.BREAKFAST_CHEF,
  breakfast_assistant: UiRole.BREAKFAST_ASSISTANT,
  buyer: UiRole.BUYER,
  store_manager: UiRole.STORE_MANAGER,
};

export const UI_ROLE_TO_API_ROLE: Record<UiRole, ApiRole> = {
  admin: ApiRole.ADMIN,
  chef_manager: ApiRole.CHEF_MANAGER,
  chef: ApiRole.CHEF,
  prep: ApiRole.PREP,
  breakfast_chef: ApiRole.BREAKFAST_CHEF,
  breakfast_assistant: ApiRole.BREAKFAST_ASSISTANT,
  buyer: ApiRole.BUYER,
  store_manager: ApiRole.STORE_MANAGER,
};

export function mapApiRoleToUi(role: ApiRole): UiRole {
  return API_ROLE_TO_UI_ROLE[role] ?? UiRole.CHEF;
}

export function mapUiRoleToApi(role: UiRole): ApiRole {
  return UI_ROLE_TO_API_ROLE[role] ?? ApiRole.CHEF;
}

export function normalizeNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function normalizeCategory(category: string): DishCategoryValue {
  const normalized = category.trim().toLowerCase();
  return CATEGORY_OPTIONS.includes(normalized as DishCategoryValue)
    ? (normalized as DishCategoryValue)
    : DishCategory.STEAM;
}

export function normalizeStation(station: string): StationValue {
  const normalized = station.trim().toLowerCase();
  return STATION_OPTIONS.includes(normalized as StationValue)
    ? (normalized as StationValue)
    : Station.WOK;
}

export function resolveApiBaseUrl(...candidates: Array<string | undefined | null>): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return DEFAULT_API_BASE_URL;
}

export const MealType = {
  LUNCH: 'lunch',
  BREAKFAST: 'breakfast',
} as const;

export type MealTypeValue = (typeof MealType)[keyof typeof MealType];

export const MealTypeOptions = [MealType.LUNCH, MealType.BREAKFAST] as const;

export const MealTypeLabels: Record<MealTypeValue, string> = {
  lunch: '正餐',
  breakfast: '早餐',
};

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type TaskStatusValue = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskSource = {
  AUTO: 'auto',
  MANUAL: 'manual',
} as const;

export type TaskSourceValue = (typeof TaskSource)[keyof typeof TaskSource];

export const MenuPlanStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type MenuPlanStatusValue = (typeof MenuPlanStatus)[keyof typeof MenuPlanStatus];

export const OperationLogModule = {
  DISH: 'dish',
  INGREDIENT: 'ingredient',
  ALGORITHM: 'algorithm',
  MENU_PLAN: 'menu-plan',
  INVENTORY: 'inventory',
  TASK: 'task',
  USER: 'user',
  STORE: 'store',
} as const;

export type OperationLogModuleValue = (typeof OperationLogModule)[keyof typeof OperationLogModule];

export const OperationLogAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  REMOVE: 'remove',
  PUBLISH: 'publish',
  CONFIG_CHANGE: 'config_change',
} as const;

export type OperationLogActionValue = (typeof OperationLogAction)[keyof typeof OperationLogAction];

export const RecommendWeight = {
  NORMAL: 1,
  RECOMMENDED: 2,
  FEATURED: 3,
} as const;

export type RecommendWeightValue = (typeof RecommendWeight)[keyof typeof RecommendWeight];

export const RecommendWeightLabels: Record<RecommendWeightValue, string> = {
  1: '普通',
  2: '推荐',
  3: '强推',
};

export const DishCategoryLabels: Record<string, string> = {
  rice: '饭类',
  steam: '蒸菜',
  griddle: '铁板',
  fry: '油炸',
  prep: '备菜',
  meat: '荤菜',
  vegetable: '素菜',
  soup: '汤品',
  panfry: '煎炒',
  casserole: '砂锅',
  stir: '小炒',
  fruit: '水果',
  cold: '凉菜',
  tea: '茶饮',
  porridge: '粥品',
  pastry: '面点',
  breakfast_drink: '早餐饮品',
};

export const IngredientCategoryLabels: Record<string, string> = {
  vegetable: '蔬菜',
  meat: '肉类',
  poultry: '禽类',
  mushroom: '菌菇',
  seafood: '水产',
  soy_product: '豆制品',
  egg: '蛋类',
  staple: '主食',
  seasoning: '调味料',
  oil: '油脂',
  noodle: '面食',
  dry_goods: '干货',
  fruit: '水果',
  dairy: '乳制品',
  pickled: '腌制品',
  frozen: '冷冻品',
  other: '其他',
};
