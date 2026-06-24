import request from './request';

export interface AuditRecord {
  id: string;
  storeId: string;
  module: 'dish' | 'ingredient' | 'menu_plan';
  action: 'create' | 'update' | 'delete' | 'publish';
  targetId: string;
  targetName?: string;
  operatedBy: string;
  operatedByName: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
}

export interface AuditListResponse {
  data: AuditRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditStatsResponse {
  byStatus: Array<{ status: string; count: number }>;
  byModule: Array<{ module: string; count: number }>;
}

export function fetchAudits(params: {
  storeId: string;
  module?: string;
  status?: string;
  action?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  query.set('storeId', params.storeId);
  if (params.module) query.set('module', params.module);
  if (params.status) query.set('status', params.status);
  if (params.action) query.set('action', params.action);
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  return request<AuditListResponse>({
    url: `/audit?${query.toString()}`,
    auth: true,
  });
}

export function fetchAuditStats(storeId: string) {
  return request<AuditStatsResponse>({
    url: `/audit/stats?storeId=${encodeURIComponent(storeId)}`,
    auth: true,
  });
}

export function approveAudit(id: string) {
  return request<AuditRecord>({
    url: `/audit/${id}/approve`,
    method: 'PATCH',
    auth: true,
  });
}

export function rejectAudit(id: string, rejectReason: string) {
  return request<AuditRecord>({
    url: `/audit/${id}/reject`,
    method: 'PATCH',
    auth: true,
    data: { rejectReason },
  });
}
