import request from './request';

export type DataImportType = 'dish' | 'ingredient';
export type DataImportMode = 'merge' | 'replace' | 'skip_duplicate';

export interface ParseDataImportResponse {
  type: DataImportType;
  mode: DataImportMode;
  valid: boolean;
  total: number;
  items: Record<string, any>[];
  issues: Array<{ row: number; message: string }>;
}

export interface ExecuteDataImportResponse {
  success: boolean;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  issues: Array<{ row: number; message: string }>;
}

export function parseDataImport(payload: {
  type: DataImportType;
  mode: DataImportMode;
  rawText: string;
}) {
  return request<ParseDataImportResponse>({
    url: '/data-import/parse',
    method: 'POST',
    auth: true,
    data: payload,
  });
}

export function executeDataImport(payload: {
  type: DataImportType;
  mode: DataImportMode;
  items: Record<string, any>[];
  rawText?: string;
}) {
  return request<ExecuteDataImportResponse>({
    url: '/data-import/execute',
    method: 'POST',
    auth: true,
    data: payload,
  });
}
