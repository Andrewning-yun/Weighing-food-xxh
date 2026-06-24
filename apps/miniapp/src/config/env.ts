import { MINIAPP_DEFAULT_API_BASE_URL, resolveApiBaseUrl } from '../../../../packages/config/index';

declare const MINIAPP_API_BASE_URL: string | undefined;

export const API_BASE_URL = resolveApiBaseUrl(
  typeof MINIAPP_API_BASE_URL !== 'undefined' ? MINIAPP_API_BASE_URL : undefined,
  undefined,
  undefined,
  MINIAPP_DEFAULT_API_BASE_URL,
);
