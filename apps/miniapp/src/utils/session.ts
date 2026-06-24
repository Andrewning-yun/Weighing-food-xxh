import Taro from '@tarojs/taro';
import { MINIAPP_SESSION_USER_KEY, MINIAPP_TOKEN_KEY } from '../../../../packages/config/index';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  displayName: string;
  role: string;
  station?: string;
  storeId?: string;
  storeName?: string;
}

const TOKEN_KEY = MINIAPP_TOKEN_KEY;
const USER_KEY = MINIAPP_SESSION_USER_KEY;
const ACTIVE_STORE_ID_KEY = 'fastfood-kitchen-active-store-id';
const ACTIVE_STORE_NAME_KEY = 'fastfood-kitchen-active-store-name';

const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  chef_manager: '厨房主管',
  chef: '厨师',
  prep: '备料员',
  breakfast_chef: '早餐主厨',
  breakfast_assistant: '早餐帮工',
  buyer: '采购员',
  store_manager: '门店经理',
};

export function toSessionUser(source: {
  id: string;
  username: string;
  name?: string;
  displayName?: string;
  role: string;
  station?: string;
  storeId?: string;
  storeName?: string;
}): SessionUser {
  const displayName = source.displayName || source.name || source.username;

  return {
    id: source.id,
    username: source.username,
    name: displayName,
    displayName,
    role: source.role,
    station: source.station,
    storeId: source.storeId,
    storeName: source.storeName,
  };
}

export function formatRoleLabel(role?: string): string {
  if (!role) {
    return '游客';
  }

  return ROLE_LABELS[role] || role;
}

export function formatSessionUser(user: SessionUser | null): string {
  if (!user) {
    return '未登录';
  }

  const storeLabel = user.storeName || user.storeId ? `，${user.storeName || user.storeId}` : '';
  return `${user.displayName}（${formatRoleLabel(user.role)}）${storeLabel}`;
}

export function getToken(): string {
  return Taro.getStorageSync<string>(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  Taro.setStorageSync(TOKEN_KEY, token);
}

export function clearToken() {
  Taro.removeStorageSync(TOKEN_KEY);
}

export function getSessionUser(): SessionUser | null {
  const value = Taro.getStorageSync<SessionUser | string>(USER_KEY);

  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as SessionUser;
    } catch {
      return null;
    }
  }

  const displayName = value.displayName || value.name || value.username || '';
  return {
    ...value,
    username: value.username || '',
    name: displayName,
    displayName,
    storeName: value.storeName,
  };
}

export function setSessionUser(user: SessionUser) {
  Taro.setStorageSync(USER_KEY, user);
  if (user.storeId) {
    ensureActiveStore(user);
  } else {
    clearActiveStore();
  }
}

export function clearSessionUser() {
  Taro.removeStorageSync(USER_KEY);
}

export function getActiveStoreId(fallbackUser?: SessionUser | null): string {
  const cached = Taro.getStorageSync<string>(ACTIVE_STORE_ID_KEY);
  if (cached) {
    return cached;
  }

  const user = fallbackUser ?? getSessionUser();
  if (user?.storeId) {
    setActiveStore(user.storeId, user.storeName);
    return user.storeId;
  }

  return '';
}

export function getActiveStoreName(fallbackUser?: SessionUser | null): string {
  const cached = Taro.getStorageSync<string>(ACTIVE_STORE_NAME_KEY);
  if (cached) {
    return cached;
  }

  const user = fallbackUser ?? getSessionUser();
  return user?.storeName || '';
}

export function setActiveStore(storeId: string, storeName?: string) {
  if (!storeId) {
    clearActiveStore();
    return;
  }

  Taro.setStorageSync(ACTIVE_STORE_ID_KEY, storeId);
  if (storeName) {
    Taro.setStorageSync(ACTIVE_STORE_NAME_KEY, storeName);
  } else {
    Taro.removeStorageSync(ACTIVE_STORE_NAME_KEY);
  }
}

export function clearActiveStore() {
  Taro.removeStorageSync(ACTIVE_STORE_ID_KEY);
  Taro.removeStorageSync(ACTIVE_STORE_NAME_KEY);
}

function ensureActiveStore(user: SessionUser) {
  const currentStoreId = Taro.getStorageSync<string>(ACTIVE_STORE_ID_KEY);
  if (!currentStoreId && user.storeId) {
    setActiveStore(user.storeId, user.storeName);
  }
}

export function clearSession() {
  clearToken();
  clearSessionUser();
  clearActiveStore();
}

export function hasSession(): boolean {
  return Boolean(getToken());
}
