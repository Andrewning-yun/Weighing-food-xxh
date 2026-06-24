import { ScrollView, Text, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import request from '../../api/request';
import { getActiveStoreId, getSessionUser, hasSession } from '../../utils/session';
import './index.scss';

interface OperationLogRecord {
  id: string;
  storeId: string;
  operatedBy: string;
  operatedByName: string;
  module: string;
  action: string;
  targetId: string;
  targetName?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  summary?: string;
  createdAt: string;
}

interface OperationLogResponse {
  data: OperationLogRecord[];
  total: number;
  page: number;
  limit: number;
}

interface OperationLogStatsResponse {
  byModule: Array<{ module: string; count: number }>;
  byOperator: Array<{ operatedBy: string; operatedByName: string; count: number }>;
}

interface LogFilters {
  module: string;
  action: string;
  operatedBy: string;
  startDate: string;
  endDate: string;
}

const MODULE_LABELS: Record<string, string> = {
  dish: '菜品',
  ingredient: '食材',
  algorithm: '推荐算法',
  menu_plan: '菜单计划',
  inventory: '库存',
  task: '任务',
  user: '用户',
  store: '门店',
};

const ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  publish: '发布',
  config_change: '配置变更',
};

const FILTER_MODULES = ['all', 'dish', 'ingredient', 'algorithm', 'menu_plan', 'inventory', 'task', 'user', 'store'];
const FILTER_ACTIONS = ['all', 'create', 'update', 'delete', 'publish', 'config_change'];

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function isAdminOrStoreManager(role?: string) {
  return role === 'admin' || role === 'store_manager';
}

function isAdmin(role?: string) {
  return role === 'admin';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function labelModule(module: string) {
  return MODULE_LABELS[module] || module;
}

function labelAction(action: string) {
  return ACTION_LABELS[action] || action;
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return '空';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function buildDiffEntries(before?: Record<string, unknown> | null, after?: Record<string, unknown> | null) {
  const keys = new Set<string>([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  return Array.from(keys)
    .map((key) => {
      const prev = before ? before[key] : undefined;
      const next = after ? after[key] : undefined;
      if (JSON.stringify(prev) === JSON.stringify(next)) return null;
      return {
        key,
        before: stringifyValue(prev),
        after: stringifyValue(next),
      };
    })
    .filter((item): item is { key: string; before: string; after: string } => item !== null);
}

export default function OperationLogPage() {
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<OperationLogRecord[]>([]);
  const [stats, setStats] = useState<OperationLogStatsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<LogFilters>({
    module: '',
    action: '',
    operatedBy: '',
    startDate: '',
    endDate: '',
  });
  const [draftFilters, setDraftFilters] = useState<LogFilters>(filters);

  const user = getSessionUser();
  const storeId = getActiveStoreId(user);
  const role = user?.role || '';
  const canView = isAdminOrStoreManager(role);
  const canViewStats = isAdmin(role);

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    if (!canView) {
      setBusy(false);
      return;
    }

    void loadData(1, filters);
  }, []);

  async function loadData(nextPage = 1, nextFilters = filters) {
    if (!storeId) {
      setBusy(false);
      setMessage('当前账号未绑定门店，无法查看操作日志。');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const query: Record<string, string | number> = {
        storeId,
        page: nextPage,
        limit,
      };

      if (nextFilters.module && nextFilters.module !== 'all') query.module = nextFilters.module;
      if (nextFilters.action && nextFilters.action !== 'all') query.action = nextFilters.action;
      if (nextFilters.operatedBy.trim()) query.operatedBy = nextFilters.operatedBy.trim();
      if (nextFilters.startDate.trim()) query.startDate = nextFilters.startDate.trim();
      if (nextFilters.endDate.trim()) query.endDate = nextFilters.endDate.trim();

      const [logResult, statsResult] = await Promise.all([
        request<OperationLogResponse>({ url: '/operation-logs', auth: true, data: query }),
        canViewStats ? request<OperationLogStatsResponse>({ url: '/operation-logs/stats', auth: true, data: { storeId } }).catch(() => null) : Promise.resolve(null),
      ]);

      setLogs(logResult.data || []);
      setTotal(logResult.total || 0);
      setPage(logResult.page || nextPage);
      setStats(statsResult);
      setFilters(nextFilters);
      setDraftFilters(nextFilters);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载操作日志失败');
      setLogs([]);
      setStats(null);
      setTotal(0);
    } finally {
      setBusy(false);
    }
  }

  function applyFilters() {
    void loadData(1, draftFilters);
  }

  function resetFilters() {
    const next = {
      module: '',
      action: '',
      operatedBy: '',
      startDate: '',
      endDate: '',
    };
    void loadData(1, next);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentRangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const currentRangeEnd = Math.min(page * limit, total);

  const moduleSummary = useMemo(() => {
    return (stats?.byModule || []).slice(0, 6);
  }, [stats]);

  const operatorSummary = useMemo(() => {
    return (stats?.byOperator || []).slice(0, 4);
  }, [stats]);

  return (
    <View className='screen operation-log-screen'>
      <View className='ol-hero shell-card'>
        <View>
          <Text className='eyebrow'>操作审计</Text>
          <Text className='ol-title'>操作日志</Text>
          <Text className='ol-subtitle'>
            {canView ? '按模块、动作和日期筛选，查看所有关键变更记录。' : '当前角色无权查看操作日志。'}
          </Text>
        </View>
        <View className='ol-kpis'>
          <View className='ol-kpi'>
            <Text className='ol-kpi-label'>总记录</Text>
            <Text className='ol-kpi-value'>{total}</Text>
          </View>
          <View className='ol-kpi'>
            <Text className='ol-kpi-label'>当前页</Text>
            <Text className='ol-kpi-value'>{page}/{totalPages}</Text>
          </View>
          <View className='ol-kpi'>
            <Text className='ol-kpi-label'>模块</Text>
            <Text className='ol-kpi-value'>{moduleSummary.length}</Text>
          </View>
          <View className='ol-kpi'>
            <Text className='ol-kpi-label'>操作者</Text>
            <Text className='ol-kpi-value'>{operatorSummary.length}</Text>
          </View>
        </View>
      </View>

      {canView ? (
        <>
          <View className='shell-card ol-filters'>
            <View className='ol-filter-row'>
              <View className='ol-field'>
                <Text className='ol-field-label'>模块</Text>
                <NutInput
                  className='ol-input'
                  placeholder='全部 / 菜品 / 食材 / ...'
                  value={draftFilters.module}
                  onChange={(v) => setDraftFilters((prev) => ({ ...prev, module: v }))}
                />
              </View>
              <View className='ol-field'>
                <Text className='ol-field-label'>动作</Text>
                <NutInput
                  className='ol-input'
                  placeholder='新增 / 修改 / 删除 ...'
                  value={draftFilters.action}
                  onChange={(v) => setDraftFilters((prev) => ({ ...prev, action: v }))}
                />
              </View>
            </View>

            <View className='ol-filter-row'>
              <View className='ol-field'>
                <Text className='ol-field-label'>操作者</Text>
                <NutInput
                  className='ol-input'
                  placeholder='输入用户名或 ID'
                  value={draftFilters.operatedBy}
                  onChange={(v) => setDraftFilters((prev) => ({ ...prev, operatedBy: v }))}
                />
              </View>
              <View className='ol-field'>
                <Text className='ol-field-label'>起始日期</Text>
                <NutInput
                  className='ol-input'
                  placeholder='例如 2026-05-01'
                  value={draftFilters.startDate}
                  onChange={(v) => setDraftFilters((prev) => ({ ...prev, startDate: v }))}
                />
              </View>
            </View>

            <View className='ol-filter-row'>
              <View className='ol-field'>
                <Text className='ol-field-label'>结束日期</Text>
                <NutInput
                  className='ol-input'
                  placeholder='例如 2026-05-01'
                  value={draftFilters.endDate}
                  onChange={(v) => setDraftFilters((prev) => ({ ...prev, endDate: v }))}
                />
              </View>
              <View className='ol-field ol-field-actions'>
                <NutButton size='mini' onClick={applyFilters} loading={busy}>
                  查询
                </NutButton>
                <NutButton size='mini' onClick={resetFilters}>
                  重置
                </NutButton>
              </View>
            </View>

            <ScrollView scrollX className='ol-chip-scroll'>
              <View className='ol-chip-row'>
                {FILTER_MODULES.map((module) => (
                  <View
                    key={module}
                    className={`ol-chip ${draftFilters.module === module || (!draftFilters.module && module === 'all') ? 'ol-chip-active' : ''}`}
                    onClick={() => setDraftFilters((prev) => ({ ...prev, module: module === 'all' ? '' : module }))}
                  >
                    <Text>{module === 'all' ? '全部模块' : labelModule(module)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <ScrollView scrollX className='ol-chip-scroll'>
              <View className='ol-chip-row'>
                {FILTER_ACTIONS.map((action) => (
                  <View
                    key={action}
                    className={`ol-chip ${draftFilters.action === action || (!draftFilters.action && action === 'all') ? 'ol-chip-active' : ''}`}
                    onClick={() => setDraftFilters((prev) => ({ ...prev, action: action === 'all' ? '' : action }))}
                  >
                    <Text>{action === 'all' ? '全部动作' : labelAction(action)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {message ? <Text className='ol-message'>{message}</Text> : null}

          {canViewStats && stats ? (
            <View className='ol-stats-grid'>
              <View className='shell-card ol-stat-card'>
                <Text className='ol-section-title'>模块分布</Text>
                {moduleSummary.length > 0 ? (
                  moduleSummary.map((item) => (
                    <View key={item.module} className='ol-stat-line'>
                      <Text className='ol-stat-label'>{labelModule(item.module)}</Text>
                      <Text className='ol-stat-value'>{item.count}</Text>
                    </View>
                  ))
                ) : (
                  <Text className='ol-empty-text'>暂无模块统计</Text>
                )}
              </View>

              <View className='shell-card ol-stat-card'>
                <Text className='ol-section-title'>操作人分布</Text>
                {operatorSummary.length > 0 ? (
                  operatorSummary.map((item) => (
                    <View key={`${item.operatedBy}-${item.operatedByName}`} className='ol-stat-line'>
                      <Text className='ol-stat-label'>{item.operatedByName || item.operatedBy}</Text>
                      <Text className='ol-stat-value'>{item.count}</Text>
                    </View>
                  ))
                ) : (
                  <Text className='ol-empty-text'>暂无操作者统计</Text>
                )}
              </View>
            </View>
          ) : null}

          {busy ? (
            <View className='shell-card ol-loading'>
              <Text className='ol-loading-text'>正在加载操作日志...</Text>
            </View>
          ) : null}

          {!busy && logs.length === 0 ? (
            <View className='shell-card ol-empty'>
              <Text className='ol-empty-title'>没有找到日志</Text>
              <Text className='ol-empty-text'>
                {total === 0
                  ? '当前筛选条件下没有可显示的记录。'
                  : `显示第 ${currentRangeStart} - ${currentRangeEnd} 条，共 ${total} 条。`}
              </Text>
            </View>
          ) : null}

          {!busy && logs.length > 0 ? (
            <View className='ol-list'>
              {logs.map((log) => {
                const diffEntries = buildDiffEntries(log.before, log.after);
                return (
                  <View key={log.id} className='shell-card ol-card'>
                    <View className='ol-card-head'>
                      <View>
                        <Text className='ol-card-title'>
                          {labelModule(log.module)} · {labelAction(log.action)}
                        </Text>
                        <Text className='ol-card-subtitle'>
                          {log.targetName || log.targetId} · {log.operatedByName || log.operatedBy}
                        </Text>
                      </View>
                      <Text className='ol-time'>{formatDateTime(log.createdAt)}</Text>
                    </View>

                    {log.summary ? <Text className='ol-summary'>{log.summary}</Text> : null}

                    <View className='ol-tag-row'>
                      <Text className='ol-tag'>{log.targetName || log.targetId}</Text>
                      <Text className='ol-tag'>{log.operatedByName || log.operatedBy}</Text>
                      <Text className='ol-tag'>{log.storeId}</Text>
                    </View>

                    <View className='ol-diff-block'>
                      <Text className='ol-section-title'>变更详情</Text>
                      {diffEntries.length > 0 ? (
                        diffEntries.slice(0, 4).map((entry) => (
                          <View key={entry.key} className='ol-diff-row'>
                            <Text className='ol-diff-key'>{entry.key}</Text>
                            <Text className='ol-diff-value ol-diff-before'>前：{entry.before}</Text>
                            <Text className='ol-diff-value ol-diff-after'>后：{entry.after}</Text>
                          </View>
                        ))
                      ) : (
                        <Text className='ol-empty-text'>日志没有结构化 before/after 数据，仅显示摘要。</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {total > limit ? (
            <View className='ol-pagination shell-card'>
              <NutButton size='mini' disabled={page <= 1 || busy} onClick={() => void loadData(Math.max(1, page - 1), filters)}>
                上一页
              </NutButton>
              <Text className='ol-pagination-text'>
                {page} / {totalPages}
              </Text>
              <NutButton size='mini' disabled={page >= totalPages || busy} onClick={() => void loadData(Math.min(totalPages, page + 1), filters)}>
                下一页
              </NutButton>
            </View>
          ) : null}
        </>
      ) : (
        <View className='shell-card ol-empty'>
          <Text className='ol-empty-title'>无权限访问</Text>
          <Text className='ol-empty-text'>操作日志仅对管理员和店长开放。</Text>
        </View>
      )}
    </View>
  );
}
