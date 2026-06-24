import request from './request';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface SessionApiUser {
  id: string;
  username: string;
  name?: string;
  role: string;
  storeId?: string;
  storeName?: string;
}

export interface LoginResponse {
  token: string;
  user: SessionApiUser;
}

export interface BindStatusResponse {
  bound: boolean;
  user: SessionApiUser | null;
}

export interface BindCodeResponse extends LoginResponse {}

export interface GeneratedBindCode {
  code: string;
  expiresAt: string;
  user: SessionApiUser;
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>({
    url: '/auth/login',
    method: 'POST',
    data: payload,
  });
}

export function wxLogin(code: string) {
  return request<LoginResponse>({
    url: '/auth/wx-login',
    method: 'POST',
    data: { code },
  });
}

export function fetchBindStatus(code: string) {
  return request<BindStatusResponse>({
    url: `/auth/bind-status?code=${encodeURIComponent(code)}`,
  });
}

export function bindCode(bindCodeValue: string, code: string) {
  return request<BindCodeResponse>({
    url: '/auth/bind-code',
    method: 'POST',
    data: {
      bindCode: bindCodeValue,
      code,
    },
  });
}

export function generateBindCode(username: string) {
  return request<GeneratedBindCode>({
    url: '/auth/generate-bind-code',
    method: 'POST',
    auth: true,
    data: { username },
  });
}

export function me() {
  return request<SessionApiUser>({
    url: '/auth/me',
    auth: true,
  });
}
