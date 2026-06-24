import request from './request';

export interface OperationLog {
  id: string;
  storeId: string;
  module: string;
  action: string;
  operatedBy: string;
  detail?: string;
  createdAt: string;
}

export interface OperationLogStats {
  total: number;
  byModule?: Record<string, number>;
  byAction?: Record<string, number>;
}

export function fetchOperationLogs(query: {
  storeId: string;
  module?: string;
  action?: string;
  operatedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return request<OperationLog[]>({
    url: '/operation-logs',
    auth: true,
    data: query,
  });
}

export function fetchOperationLogStats(storeId: string) {
  return request<OperationLogStats>({
    url: '/operation-logs/stats',
    auth: true,
    data: { storeId },
  });
}
