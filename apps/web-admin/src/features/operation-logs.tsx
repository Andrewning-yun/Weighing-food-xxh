import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import Select from 'tdesign-react/es/select';
import Textarea from 'tdesign-react/es/textarea';
import Tag from 'tdesign-react/es/tag';
import Space from 'tdesign-react/es/space';
import {
  fetchStores,
  getOperationLogStats,
  listOperationLogs,
  type OperationLogRecord,
} from '../lib/api';
import { formatDateTime } from '../lib/format';

const MODULE_OPTIONS = ['dish', 'ingredient', 'store', 'user', 'menu-plan', 'inventory', 'task'];
const PAGE_SIZE = 20;

const MODULE_SELECT_OPTIONS = [
  { value: '', label: '全部模块' },
  ...MODULE_OPTIONS.map((m) => ({ value: m, label: m })),
];

function formatJson(value: Record<string, unknown> | null | undefined) {
  if (!value) return '-';
  return JSON.stringify(value, null, 2);
}

function getOperatorName(log: OperationLogRecord) {
  return log.operatedByName || log.operatorName || log.operatedBy || log.operatorId || '-';
}

export function OperationLogsPage() {
  const { data: stores = [] } = useSWR('oplog-stores', fetchStores);
  const [queryStoreId, setQueryStoreId] = useState('');
  const [queryModule, setQueryModule] = useState('');
  const [queryOperator, setQueryOperator] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Set initial store
  if (!queryStoreId && stores.length > 0) {
    setQueryStoreId(stores[0].id);
  }

  const { data: logs = [], isLoading } = useSWR(
    queryStoreId ? ['operation-logs', queryStoreId, queryModule, queryOperator, dateFrom, dateTo] : null,
    () => listOperationLogs({
      storeId: queryStoreId,
      module: queryModule || undefined,
      operator: queryOperator || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
  );

  const { data: stats } = useSWR(
    queryStoreId ? ['operation-logs-stats', queryStoreId] : null,
    () => getOperationLogStats(queryStoreId).catch(() => null),
  );

  const moduleStats = stats?.byModule || {};
  const totalLogs = logs.length || stats?.totalLogs || 0;

  const pagedLogs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, page]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="page-stack">
      <Card title="操作日志" subtitle="按门店筛选操作日志，查看变更前后数据。" actions={<Tag theme="default">{totalLogs} 条日志</Tag>} bordered>
        {isLoading ? <p className="muted">正在加载日志...</p> : null}

        <div className="grid-form">
          <label>
            <span className="detail-label">门店</span>
            <Select value={queryStoreId || undefined} onChange={(v) => setQueryStoreId(v as string)} options={storeOptions} placeholder="选择门店" clearable={false} />
          </label>
          <label>
            <span className="detail-label">模块</span>
            <Select value={queryModule || undefined} onChange={(v) => setQueryModule((v as string) || '')} options={MODULE_SELECT_OPTIONS} placeholder="全部模块" />
          </label>
          <label>
            <span className="detail-label">操作人 ID</span>
            <Input
              value={queryOperator}
              onChange={(v) => setQueryOperator(v as string)}
              placeholder="按操作人ID筛选"
            />
          </label>
          <label>
            <span className="detail-label">开始日期</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} style={{ width: '100%', borderRadius: 'var(--td-radius-default, 6px)', border: '1px solid var(--td-component-border)', padding: '5px 8px', height: 32, fontSize: '0.9rem', background: 'var(--td-bg-color-container)' }} />
          </label>
          <label>
            <span className="detail-label">结束日期</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} style={{ width: '100%', borderRadius: 'var(--td-radius-default, 6px)', border: '1px solid var(--td-component-border)', padding: '5px 8px', height: 32, fontSize: '0.9rem', background: 'var(--td-bg-color-container)' }} />
          </label>
        </div>

        <div className="detail-grid">
          <div>
            <span className="detail-label">当前页码</span>
            <strong>{page} / {totalPages}</strong>
          </div>
          <div>
            <span className="detail-label">已加载行数</span>
            <strong>{logs.length}</strong>
          </div>
          <div className="grid-span-2">
            <span className="detail-label">模块分布</span>
            <p className="muted">
              {Object.keys(moduleStats).length === 0
                ? '暂无统计数据。'
                : Object.entries(moduleStats)
                    .map(([module, count]) => `${module}: ${count}`)
                    .join(' | ')}
            </p>
          </div>
        </div>
      </Card>

      <Card title="操作详情" subtitle="分页日志与变更详情"
        actions={
          <Space>
            <Button variant="outline" size="small" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>上一页</Button>
            <Button variant="outline" size="small" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>下一页</Button>
          </Space>
        } bordered>
        {pagedLogs.length === 0 ? (
          <p className="muted">当前页没有日志记录。</p>
        ) : (
          <div className="stack-list">
            {pagedLogs.map((log) => (
              <div key={log.id} className="nested-card">
                <div className="row-split">
                  <strong>
                    {log.module} / {log.action}
                  </strong>
                  <Tag theme="default">{formatDateTime(log.createdAt)}</Tag>
                </div>

                <div className="detail-grid">
                  <div>
                    <span className="detail-label">操作人</span>
                    <strong>{getOperatorName(log)}</strong>
                  </div>
                  <div>
                    <span className="detail-label">目标</span>
                    <strong>{log.targetName || log.targetId}</strong>
                  </div>
                  <div className="grid-span-2">
                    <span className="detail-label">摘要</span>
                    <p className="muted">{log.summary || '暂无摘要'}</p>
                  </div>
                </div>

                <div className="inline-grid inline-grid-2">
                  <label className="grid-span-2">
                    <span className="detail-label">变更前</span>
                    <Textarea value={formatJson(log.before)} readonly />
                  </label>
                  <label className="grid-span-2">
                    <span className="detail-label">变更后</span>
                    <Textarea value={formatJson(log.after)} readonly />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
