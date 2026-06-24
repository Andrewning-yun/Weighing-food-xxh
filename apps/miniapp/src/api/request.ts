import Taro from '@tarojs/taro';
import { API_BASE_URL } from '../config/env';
import { clearSession, getToken } from '../utils/session';

export class ApiError extends Error {
  statusCode?: number;
  code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isSessionExpiredError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === 'SESSION_EXPIRED';
}

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  auth?: boolean;
}

function createSessionExpiredError(): ApiError {
  return new ApiError('登录状态已失效，请重新登录', 401, 'SESSION_EXPIRED');
}

async function request<T>(options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();

  if (options.auth) {
    if (!token) {
      clearSession();
      throw createSessionExpiredError();
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await Taro.request({
    url: `${API_BASE_URL}${options.url}`,
    method: options.method || 'GET',
    data: options.data,
    header: headers,
  });

  if (response.statusCode === 401 && options.auth) {
    clearSession();
    throw createSessionExpiredError();
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new ApiError(
      (response.data as { message?: string })?.message || '请求失败',
      response.statusCode,
    );
  }

  const payload = response.data as { success?: boolean; data?: T; message?: string };
  if (!payload.success) {
    throw new ApiError(payload.message || '操作失败', response.statusCode);
  }

  return payload.data as T;
}

export default request;
