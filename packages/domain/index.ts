export enum UserRole {
  ADMIN = 'admin',
  CHEF_MANAGER = 'chef_manager',
  CHEF = 'chef',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  storeId?: string;
  storeName?: string;
  name: string;
  wechatOpenId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  brandId: string;
  chefCount: number;
  dailyCustomers: number;
  isActive: boolean;
  contactName?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  price: number;
  costPerUnit: number;
  supplier?: string;
  spec?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DishIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  wasteRate: number;
}

export interface CookingStep {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  duration?: number;
  station?: string;
}

export enum DishCategory {
  STEAM = 'steam',
  GRIDDLE = 'griddle',
  FRY = 'fry',
  PREP = 'prep',
  MEAT = 'meat',
  VEGETABLE = 'vegetable',
  SOUP = 'soup',
  RICE = 'rice',
}

export enum Station {
  WOK = 'wok',
  GRILL_FRY_STEAM = 'grill_fry_steam',
  PREP = 'prep',
  BREAKFAST_WOK = 'breakfast_wok',
  BREAKFAST_ASSIST = 'breakfast_assist',
}

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  station: Station;
  description?: string;
  coverImageUrl?: string;
  ingredients: DishIngredient[];
  steps: CookingStep[];
  ingredientCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCalculationResult {
  dishId: string;
  totalCost: number;
  ingredientCosts: {
    ingredientId: string;
    name: string;
    cost: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationRequest {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  total: number;
  list: T[];
  page: number;
  pageSize: number;
}

// Meal types
export type MealType = 'lunch' | 'breakfast';
export type RecommendWeight = 1 | 2 | 3;

// Inventory
export interface InventoryItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  perishable: boolean;
}

export interface ApiDailyInventoryRecord {
  id: string;
  storeId: string;
  date: string;
  items: InventoryItem[];
  reportedBy: string;
  createdAt: string;
}

export interface InventoryMutation {
  storeId: string;
  date: string;
  items: InventoryItem[];
}

// Menu Plan
export type MenuPlanStatus = 'draft' | 'published' | 'archived';

export interface MenuPlanDish {
  dishId: string;
  overrideQty?: number;
  isActive?: boolean;
}

export interface ApiMenuPlanRecord {
  id: string;
  storeId: string;
  date: string;
  mealType: MealType;
  dishes: MenuPlanDish[];
  status: MenuPlanStatus;
  createdBy: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuPlanMutation {
  storeId: string;
  date: string;
  mealType: MealType;
  dishes: MenuPlanDish[];
}

// Task
export type TaskSource = 'auto' | 'manual';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface TaskItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface ApiTaskRecord {
  id: string;
  storeId: string;
  date: string;
  mealType: MealType;
  source: TaskSource;
  title: string;
  items: TaskItem[];
  assignedTo?: string;
  status: TaskStatus;
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TaskMutation {
  storeId: string;
  date: string;
  mealType: MealType;
  title: string;
  items: TaskItem[];
  assignedTo?: string;
}

// Recommendation
export interface ApiDishRecommendation {
  dishId: string;
  name: string;
  category: string;
  score: number;
  reasons: string[];
  recommendWeight: RecommendWeight;
  inventoryStatus: 'in_stock_perishable' | 'in_stock' | 'no_stock';
}

// Operation Log
export interface ApiOperationLogRecord {
  id: string;
  storeId: string;
  operatedBy: string;
  operatedByName: string;
  module: string;
  action: string;
  targetId: string;
  targetName?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  summary?: string;
  createdAt: string;
}
