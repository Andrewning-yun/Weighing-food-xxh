import {
  RadishIcon,
  CutIcon,
  UserIcon,
  ShopIcon,
  FolderOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatIcon,
  ChartPieIcon,
  TaskIcon,
  StarIcon,
  SettingIcon,
  GitBranchIcon,
  TagIcon,
  CheckCircleIcon,
  HistoryIcon,
  UploadIcon,
  HomeIcon,
} from 'tdesign-icons-react';
import type { ReactElement } from 'react';
import type { SessionUser } from './api';

type UserRole =
  | 'admin'
  | 'chef_manager'
  | 'chef'
  | 'prep'
  | 'breakfast_chef'
  | 'breakfast_assistant'
  | 'buyer'
  | 'store_manager';

export type RouteGroup = 'base' | 'operations' | 'config' | 'system';

export interface RouteConfig {
  path: string;
  name: string;
  icon: ReactElement;
  iconName: string;
  roles: UserRole[];
  group: RouteGroup;
  description?: string;
}

export const GROUP_LABELS: Record<RouteGroup, string> = {
  base: '基础数据',
  operations: '运营管理',
  config: '配置中心',
  system: '系统管理',
};

export const GROUP_ORDER: RouteGroup[] = ['base', 'operations', 'config', 'system'];

export const ROUTES: RouteConfig[] = [
  // 基础数据
  { path: '/ingredients', name: '食材管理', icon: <RadishIcon />, iconName: 'RadishIcon', roles: ['admin', 'chef_manager', 'buyer', 'store_manager'], group: 'base', description: '维护食材资料、单价和分类信息' },
  { path: '/dishes', name: '菜品管理', icon: <CutIcon />, iconName: 'CutIcon', roles: ['admin', 'chef_manager', 'buyer', 'store_manager'], group: 'base', description: '维护菜品资料、成本结构和共享菜品库' },
  { path: '/stores', name: '门店管理', icon: <ShopIcon />, iconName: 'ShopIcon', roles: ['admin', 'store_manager'], group: 'base', description: '维护门店资料与价格体系' },
  { path: '/users', name: '员工管理', icon: <UserIcon />, iconName: 'UserIcon', roles: ['admin', 'chef_manager'], group: 'base', description: '管理员工账号、角色和门店归属' },

  // 运营管理
  { path: '/menu-plans', name: '菜单计划', icon: <CalendarIcon />, iconName: 'CalendarIcon', roles: ['admin', 'chef_manager', 'chef', 'breakfast_chef', 'store_manager'], group: 'operations', description: '编排每日菜单并发布到门店' },
  { path: '/inventory', name: '库存查看', icon: <FolderOpenIcon />, iconName: 'FolderOpenIcon', roles: ['admin', 'chef_manager', 'prep', 'store_manager'], group: 'operations', description: '按门店和日期查看库存填报结果' },
  { path: '/daily-metrics', name: '每日日报', icon: <ChartBarIcon />, iconName: 'ChartBarIcon', roles: ['admin', 'store_manager'], group: 'operations', description: '查看客单价、人数和经营日报记录' },
  { path: '/dish-feedback', name: '菜品反馈', icon: <ChatIcon />, iconName: 'ChatIcon', roles: ['admin', 'store_manager', 'chef_manager', 'chef', 'buyer'], group: 'operations', description: '查看剩余反馈和门店出餐表现' },

  // 配置中心
  { path: '/menu-standards', name: '菜单标准', icon: <TaskIcon />, iconName: 'TaskIcon', roles: ['admin', 'chef_manager'], group: 'config', description: '按门店和餐别配置菜单标准' },
  { path: '/default-dishes', name: '默认菜品', icon: <StarIcon />, iconName: 'StarIcon', roles: ['admin', 'chef_manager'], group: 'config', description: '配置默认白名单与固定菜品' },
  { path: '/algorithm-config', name: '算法参数', icon: <SettingIcon />, iconName: 'SettingIcon', roles: ['admin', 'chef_manager', 'buyer'], group: 'config', description: '管理推荐和评分相关参数' },
  { path: '/pairing-rules', name: '搭配规则', icon: <GitBranchIcon />, iconName: 'GitBranchIcon', roles: ['admin', 'chef_manager'], group: 'config', description: '配置菜单搭配约束与标签数量要求' },
  { path: '/dish-type-tags', name: '菜品标签', icon: <TagIcon />, iconName: 'TagIcon', roles: ['admin'], group: 'config', description: '维护大荤、小荤、素菜标签规则' },

  // 系统管理
  { path: '/audit', name: '审核管理', icon: <CheckCircleIcon />, iconName: 'CheckCircleIcon', roles: ['admin', 'store_manager', 'buyer'], group: 'system', description: '处理待审核变更并查看前后差异' },
  { path: '/operation-logs', name: '操作日志', icon: <HistoryIcon />, iconName: 'HistoryIcon', roles: ['admin', 'store_manager'], group: 'system', description: '查看关键业务变更和操作轨迹' },
  { path: '/data-import', name: '数据导入', icon: <UploadIcon />, iconName: 'UploadIcon', roles: ['admin'], group: 'system', description: '解析并执行食材、菜品批量导入' },
  { path: '/analysis', name: '菜品分析', icon: <ChartPieIcon />, iconName: 'ChartPieIcon', roles: ['admin', 'store_manager', 'chef_manager', 'buyer'], group: 'system', description: '查看食材使用、菜品频次和毛利分布' },
];

export function getRouteByPath(path: string): RouteConfig | undefined {
  return ROUTES.find((r) => r.path === path);
}

export function getRoutesByGroup(group: RouteGroup): RouteConfig[] {
  return ROUTES.filter((r) => r.group === group);
}

export function canAccessRoute(user: SessionUser | null, route: RouteConfig): boolean {
  if (!user) return false;
  if (!route.roles?.length) return true;
  return route.roles.includes(user.role as UserRole);
}

export function getDefaultRoute(user: SessionUser | null): string {
  const found = ROUTES.find((route) => canAccessRoute(user, route));
  return found?.path || '/login';
}
