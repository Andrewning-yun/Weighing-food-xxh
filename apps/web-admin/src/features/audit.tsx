import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import Select from 'tdesign-react/es/select';
import Textarea from 'tdesign-react/es/textarea';
import Table from 'tdesign-react/es/table';
import Tag from 'tdesign-react/es/tag';
import {
  approveAuditRecord,
  fetchStores,
  getAuditStats,
  listAuditRecords,
  rejectAuditRecord,
  type AuditRecord,
} from '../lib/api';
import { DataTable, type Column } from '../components/data-table';
import { toast } from '../lib/toast';
import { formatDateTime } from '../lib/format';

const MODULE_OPTIONS = [
  { value: '', label: '全部模块' },
  { value: 'dish', label: '菜品' },
  { value: 'ingredient', label: '食材' },
  { value: 'menu_plan', label: '菜单计划' },
];

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

const ACTION_OPTIONS = [
  { value: '', label: '全部动作' },
  { value: 'create', label: '创建' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'publish', label: '发布' },
];

function formatJson(value: Record<string, unknown> | null) {
  if (!value) return '无';
  return JSON.stringify(value, null, 2);
}

const COLUMNS: Column<AuditRecord>[] = [
  { colKey: 'status', title: '状态' },
  { colKey: 'module', title: '模块' },
  { colKey: 'action', title: '动作' },
  { colKey: 'targetName', title: '目标', cell: ({ row }) => row.targetName || row.targetId },
  { colKey: 'operatedByName', title: '操作人' },
  { colKey: 'createdAt', title: '创建时间', cell: ({ row }) => formatDateTime(row.createdAt) },
];

export function AuditPage() {
  const { data: stores = [] } = useSWR('audit-stores', fetchStores);
  const [storeId, setStoreId] = useState('');
  const [module, setModule] = useState('');
  const [status, setStatus] = useState('pending');
  const [action, setAction] = useState('');
  const [keyword, setKeyword] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selected, setSelected] = useState<AuditRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: records = [], isLoading, mutate } = useSWR(
    storeId ? ['audit', storeId, module, status, action, keyword] : null,
    () => listAuditRecords({
      storeId,
      module: module || undefined,
      status: status || undefined,
      action: action || undefined,
      keyword: keyword || undefined,
      page: 1,
      limit: 50,
    }).then(r => r.data),
  );

  const { data: stats } = useSWR(
    storeId ? ['audit-stats', storeId] : null,
    () => getAuditStats(storeId).catch(() => null),
  );

  // Set initial store
  if (!storeId && stores.length > 0) {
    setStoreId(stores[0].id);
  }

  // Auto-select first record
  useEffect(() => {
    if (records.length > 0 && (!selected || !records.find(r => r.id === selected.id))) {
      setSelected(records[0]);
    }
  }, [records, selected]);

  async function handleApprove() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await approveAuditRecord(selected.id);
      toast.success('审核已通过');
      await mutate();
      setSelected(updated);
      setRejectReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '审核操作失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await rejectAuditRecord(selected.id, rejectReason);
      toast.success('审核已拒绝');
      await mutate();
      setSelected(updated);
      setRejectReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '审核操作失败');
    } finally {
      setSubmitting(false);
    }
  }

  const diffSummary = useMemo(() => {
    if (!selected) return [];
    const before = selected.before || {};
    const after = selected.after || {};
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return Array.from(keys)
      .map((key) => {
        const prev = JSON.stringify(before[key]);
        const next = JSON.stringify(after[key]);
        if (prev === next) return null;
        return { key, before: prev ?? '无', after: next ?? '无' };
      })
      .filter((item): item is { key: string; before: string; after: string } => Boolean(item));
  }, [selected]);

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="page-stack">
      <Card title="审核中心" subtitle="按门店筛选待审核记录并处理变更" actions={<Tag theme="default">{records.length} 条记录</Tag>} bordered>
        <div className="grid-form">
          <label><span className="detail-label">门店</span>
            <Select value={storeId || undefined} onChange={(v) => setStoreId(v as string)} options={storeOptions} placeholder="请选择门店" clearable={false} /></label>
          <label><span className="detail-label">模块</span>
            <Select value={module || undefined} onChange={(v) => setModule((v as string) || '')} options={MODULE_OPTIONS} /></label>
          <label><span className="detail-label">状态</span>
            <Select value={status || undefined} onChange={(v) => setStatus((v as string) || '')} options={STATUS_OPTIONS} /></label>
          <label><span className="detail-label">动作</span>
            <Select value={action || undefined} onChange={(v) => setAction((v as string) || '')} options={ACTION_OPTIONS} /></label>
          <label className="grid-span-2"><span className="detail-label">关键字</span>
            <Input value={keyword} onChange={(v) => setKeyword(v as string)} placeholder="输入目标名称或操作人" /></label>
        </div>

        {stats ? (
          <div className="detail-grid">
            <div><span className="detail-label">状态统计</span>
              <p className="muted">{stats.byStatus.map((s: { status: string; count: number }) => `${s.status}: ${s.count}`).join(' | ') || '暂无'}</p></div>
            <div><span className="detail-label">模块统计</span>
              <p className="muted">{stats.byModule.map((m: { module: string; count: number }) => `${m.module}: ${m.count}`).join(' | ') || '暂无'}</p></div>
          </div>
        ) : null}
      </Card>

      <Card title="审核列表" subtitle="选择一条记录查看前后差异" bordered>
        <DataTable<AuditRecord>
          columns={COLUMNS}
          data={records}
          loading={isLoading}
          rowKey="id"
          emptyText="暂无审核记录"
          showPagination={false}
          onRowClick={(row) => setSelected(row)}
        />
      </Card>

      <Card title="变更详情" subtitle={selected ? selected.targetName || selected.targetId : '请选择审核记录'}
        actions={selected ? <Tag theme="default">{selected.status}</Tag> : undefined} bordered>
        {!selected ? (
          <p className="muted">请先从上方列表中选择一条审核记录。</p>
        ) : (
          <>
            <div className="detail-grid">
              <div><span className="detail-label">模块 / 动作</span><strong>{selected.module} / {selected.action}</strong></div>
              <div><span className="detail-label">操作人</span><strong>{selected.operatedByName}</strong></div>
              <div><span className="detail-label">拒绝原因</span><strong>{selected.rejectReason || '无'}</strong></div>
              <div><span className="detail-label">审批人</span><strong>{selected.reviewedByName || '未审批'}</strong></div>
            </div>

            <div className="inline-grid inline-grid-2">
              <label><span className="detail-label">变更前</span><Textarea value={formatJson(selected.before)} readonly /></label>
              <label><span className="detail-label">变更后</span><Textarea value={formatJson(selected.after)} readonly /></label>
            </div>

            <div className="stack-list">
              <div className="nested-card">
                <div className="row-split"><strong>差异摘要</strong><Tag theme="default">{diffSummary.length} 处变化</Tag></div>
                {diffSummary.length === 0 ? (
                  <p className="muted">当前记录没有可识别的字段差异。</p>
                ) : (
                  <div className="table-shell">
                    <Table data={diffSummary} columns={[
                      { colKey: 'key', title: '字段' },
                      { colKey: 'before', title: '变更前' },
                      { colKey: 'after', title: '变更后' },
                    ]} rowKey="key" size="small" resizable hover stripe />
                  </div>
                )}
              </div>
            </div>

            {selected.status === 'pending' ? (
              <div className="inline-grid inline-grid-2">
                <label className="grid-span-2"><span className="detail-label">拒绝原因</span>
                  <Textarea value={rejectReason} onChange={(v) => setRejectReason(v as string)} placeholder="输入拒绝原因" /></label>
                <Button theme="success" onClick={handleApprove} loading={submitting} disabled={submitting}>通过</Button>
                <Button theme="danger" onClick={handleReject} loading={submitting} disabled={submitting}>拒绝</Button>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
