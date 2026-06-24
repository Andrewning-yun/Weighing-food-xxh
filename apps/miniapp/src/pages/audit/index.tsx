import { Text, Textarea, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import { useEffect, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { approveAudit, fetchAudits, fetchAuditStats, rejectAudit, type AuditRecord } from '../../api/audit';
import { getActiveStoreId, getSessionUser, hasSession } from '../../utils/session';
import './index.scss';

type AuditTab = 'pending' | 'approved' | 'rejected';

const MODULE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'dish', label: '菜品' },
  { value: 'ingredient', label: '食材' },
  { value: 'menu_plan', label: '菜单' },
];

const TAB_OPTIONS: Array<{ value: AuditTab; label: string }> = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function canManageAudit(role?: string) {
  return role === 'admin' || role === 'store_manager' || role === 'buyer';
}

function moduleLabel(value: string) {
  return MODULE_OPTIONS.find((item) => item.value === value)?.label || value;
}

function actionLabel(value: string) {
  if (value === 'create') return '创建';
  if (value === 'update') return '更新';
  if (value === 'delete') return '删除';
  if (value === 'publish') return '发布';
  return value;
}

function diffEntries(before?: Record<string, unknown> | null, after?: Record<string, unknown> | null) {
  const keys = new Set<string>([...Object.keys(before || {}), ...Object.keys(after || {})]);
  return Array.from(keys)
    .map((key) => {
      const beforeValue = before ? before[key] : undefined;
      const afterValue = after ? after[key] : undefined;
      if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
        return null;
      }
      return {
        key,
        before: beforeValue === undefined ? '空' : JSON.stringify(beforeValue),
        after: afterValue === undefined ? '空' : JSON.stringify(afterValue),
      };
    })
    .filter((item): item is { key: string; before: string; after: string } => item !== null);
}

export default function AuditPage() {
  const user = getSessionUser();
  const role = user?.role || '';
  const storeId = getActiveStoreId(user);
  const canView = canManageAudit(role);

  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<AuditTab>('pending');
  const [moduleFilter, setModuleFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [expandedId, setExpandedId] = useState('');
  const [rejectId, setRejectId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [stats, setStats] = useState<{ byStatus: Array<{ status: string; count: number }>; byModule: Array<{ module: string; count: number }> } | null>(null);

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    if (!canView) {
      setBusy(false);
      return;
    }

    void bootstrap();
  }, [storeId, tab, moduleFilter]);

  async function bootstrap() {
    if (!storeId) {
      setBusy(false);
      setMessage('当前门店未设置，无法加载审核记录。');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const [listData, statsData] = await Promise.all([
        fetchAudits({
          storeId,
          status: tab,
          module: moduleFilter || undefined,
          keyword: keyword.trim() || undefined,
        }),
        fetchAuditStats(storeId).catch(() => null),
      ]);
      setRecords(listData.data || []);
      setStats(statsData);
    } catch (error) {
      setRecords([]);
      setStats(null);
      setMessage(error instanceof Error ? error.message : '加载审核记录失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveAudit(id);
      Taro.showToast({ title: '已通过', icon: 'success' });
      await bootstrap();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '通过审核失败');
    }
  }

  async function handleReject() {
    if (!rejectId) {
      return;
    }

    try {
      await rejectAudit(rejectId, rejectReason.trim());
      setRejectId('');
      setRejectReason('');
      Taro.showToast({ title: '已拒绝', icon: 'success' });
      await bootstrap();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '拒绝审核失败');
    }
  }

  const pendingCount = useMemo(
    () => stats?.byStatus.find((item) => item.status === 'pending')?.count || 0,
    [stats],
  );

  if (!canView) {
    return (
      <View className='audit-page'>
        <View className='shell-card audit-hero'>
          <Text className='audit-title'>审核管理</Text>
          <Text className='audit-subtitle'>当前角色无权访问审核管理。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='audit-page'>
      <View className='shell-card audit-hero'>
        <View>
          <Text className='audit-title'>审核管理</Text>
          <Text className='audit-subtitle'>待处理 {pendingCount} 条，支持查看变更前后并执行通过/拒绝。</Text>
        </View>
        <NutButton size='mini' onClick={bootstrap} loading={busy}>
          刷新
        </NutButton>
      </View>

      <View className='audit-tabs'>
        {TAB_OPTIONS.map((item) => (
          <Text key={item.value} className={`audit-tab ${tab === item.value ? 'audit-tab-active' : ''}`} onClick={() => setTab(item.value)}>
            {item.label}
          </Text>
        ))}
      </View>

      <View className='shell-card audit-filters'>
        <NutInput className='audit-input' placeholder='搜索操作人或目标名称' value={keyword} onChange={(v) => setKeyword(v)} />
        <View className='audit-chip-row'>
          {MODULE_OPTIONS.map((item) => (
            <Text
              key={item.label}
              className={`audit-chip ${moduleFilter === item.value ? 'audit-chip-active' : ''}`}
              onClick={() => setModuleFilter(item.value)}
            >
              {item.label}
            </Text>
          ))}
          <NutButton size='mini' onClick={bootstrap}>
            查询
          </NutButton>
        </View>
      </View>

      {message ? <Text className='audit-message'>{message}</Text> : null}

      {busy ? <View className='shell-card audit-card'>正在加载审核记录...</View> : null}

      {!busy && records.length === 0 ? (
        <View className='shell-card audit-card'>
          <Text className='audit-card-title'>暂无审核记录</Text>
          <Text className='audit-card-copy'>当前筛选条件下没有可显示的审核数据。</Text>
        </View>
      ) : null}

      {!busy &&
        records.map((record) => {
          const expanded = expandedId === record.id;
          const entries = diffEntries(record.before, record.after);

          return (
            <View key={record.id} className='shell-card audit-card'>
              <View className='audit-card-head' onClick={() => setExpandedId(expanded ? '' : record.id)}>
                <View>
                  <Text className='audit-card-title'>{moduleLabel(record.module)} · {actionLabel(record.action)}</Text>
                  <Text className='audit-card-copy'>{record.targetName || record.targetId} · {record.operatedByName}</Text>
                </View>
                <Text className='audit-chip audit-chip-active'>{TAB_OPTIONS.find((item) => item.value === record.status)?.label || record.status}</Text>
              </View>

              {expanded ? (
                <>
                  <View className='audit-compare'>
                    <View className='audit-panel'>
                      <Text className='audit-panel-title'>变更前</Text>
                      {entries.length > 0 ? (
                        entries.map((item) => (
                          <Text key={`before-${item.key}`} className='audit-panel-copy'>
                            {item.key}：{item.before}
                          </Text>
                        ))
                      ) : (
                        <Text className='audit-panel-copy'>无可对比字段</Text>
                      )}
                    </View>
                    <View className='audit-panel'>
                      <Text className='audit-panel-title'>变更后</Text>
                      {entries.length > 0 ? (
                        entries.map((item) => (
                          <Text key={`after-${item.key}`} className='audit-panel-copy'>
                            {item.key}：{item.after}
                          </Text>
                        ))
                      ) : (
                        <Text className='audit-panel-copy'>无可对比字段</Text>
                      )}
                    </View>
                  </View>

                  {record.status === 'pending' ? (
                    <View className='audit-actions'>
                      <NutButton size='mini' onClick={() => void handleApprove(record.id)}>
                        通过
                      </NutButton>
                      <NutButton size='mini' onClick={() => setRejectId(record.id)}>
                        拒绝
                      </NutButton>
                    </View>
                  ) : null}

                  {record.status === 'rejected' && record.rejectReason ? (
                    <Text className='audit-panel-copy'>拒绝原因：{record.rejectReason}</Text>
                  ) : null}
                </>
              ) : null}
            </View>
          );
        })}

      {rejectId ? (
        <View className='shell-card audit-card'>
          <Text className='audit-card-title'>填写拒绝原因</Text>
          <Textarea className='audit-textarea' placeholder='请填写拒绝原因' value={rejectReason} onInput={(e) => setRejectReason(e.detail.value)} />
          <View className='audit-actions'>
            <NutButton size='mini' onClick={() => setRejectId('')}>
              取消
            </NutButton>
            <NutButton size='mini' onClick={() => void handleReject()}>
              提交拒绝
            </NutButton>
          </View>
        </View>
      ) : null}
    </View>
  );
}
