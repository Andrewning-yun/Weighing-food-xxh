type Role =
  | 'admin'
  | 'chef_manager'
  | 'chef'
  | 'prep'
  | 'breakfast_chef'
  | 'breakfast_assistant'
  | 'buyer'
  | 'store_manager';

type PageName =
  | 'index'
  | 'menu-plan'
  | 'tasks'
  | 'my'
  | 'inventory'
  | 'ingredients'
  | 'dishes'
  | 'dish-edit'
  | 'analysis'
  | 'daily-report'
  | 'store-manage'
  | 'staff-manage'
  | 'algorithm-config'
  | 'menu-standard'
  | 'audit'
  | 'data-import'
  | 'operation-log';

const ROLE_PAGE_ACCESS: Record<Role, PageName[]> = {
  admin: [
    'index',
    'menu-plan',
    'tasks',
    'my',
    'inventory',
    'ingredients',
    'dishes',
    'dish-edit',
    'analysis',
    'daily-report',
    'store-manage',
    'staff-manage',
    'algorithm-config',
    'menu-standard',
    'audit',
    'data-import',
    'operation-log',
  ],
  chef_manager: [
    'index',
    'menu-plan',
    'tasks',
    'my',
    'inventory',
    'ingredients',
    'dishes',
    'dish-edit',
    'analysis',
    'staff-manage',
    'algorithm-config',
    'menu-standard',
  ],
  chef: ['index', 'menu-plan', 'tasks', 'my', 'ingredients', 'dishes', 'dish-edit', 'analysis'],
  prep: ['index', 'tasks', 'my', 'inventory', 'ingredients', 'dishes', 'analysis'],
  breakfast_chef: ['index', 'menu-plan', 'tasks', 'my', 'ingredients', 'dishes', 'dish-edit', 'analysis'],
  breakfast_assistant: ['index', 'menu-plan', 'tasks', 'my', 'ingredients', 'dishes', 'analysis'],
  buyer: ['index', 'tasks', 'my', 'ingredients', 'dishes', 'analysis', 'algorithm-config', 'audit'],
  store_manager: ['index', 'menu-plan', 'tasks', 'my', 'analysis', 'daily-report', 'store-manage', 'audit', 'operation-log'],
};

export function canAccessPage(role: Role, pageName: PageName): boolean {
  return ROLE_PAGE_ACCESS[role]?.includes(pageName) || false;
}

export function isReadOnly(role: Role): boolean {
  return role === 'store_manager';
}

export function canEditMealType(role: Role, mealType: 'lunch' | 'breakfast'): boolean {
  if (role === 'admin') return true;
  if (role === 'chef_manager' || role === 'chef') return mealType === 'lunch';
  if (role === 'breakfast_chef' || role === 'breakfast_assistant') return mealType === 'breakfast';
  return false;
}
