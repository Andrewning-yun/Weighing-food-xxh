import request from './request';

export interface AlgorithmConfigGroups {
  ticketPrice?: Record<string, number>;
  freshness?: Record<string, number>;
  profit?: Record<string, number>;
  diversity?: Record<string, number>;
  category?: Record<string, number>;
  feedback?: Record<string, number>;
  output?: Record<string, number>;
}

export interface AlgorithmConfigResponse {
  storeId: string;
  config: AlgorithmConfigGroups;
}

export interface UpdateAlgorithmConfigPayload {
  storeId: string;
  config: AlgorithmConfigGroups;
}

export function fetchAlgorithmConfig(storeId: string) {
  return request<AlgorithmConfigResponse>({
    url: `/algorithm-config?storeId=${encodeURIComponent(storeId)}`,
    auth: true,
  });
}

export function updateAlgorithmConfig(payload: UpdateAlgorithmConfigPayload) {
  return request<AlgorithmConfigResponse>({
    url: '/algorithm-config',
    method: 'PUT',
    auth: true,
    data: payload,
  });
}
