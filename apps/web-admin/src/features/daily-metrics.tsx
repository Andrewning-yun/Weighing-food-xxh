'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import InputNumber from 'tdesign-react/es/input-number';
import Select from 'tdesign-react/es/select';
import Tag from 'tdesign-react/es/tag';
import {
  fetchDailyMetrics,
  fetchStores,
  saveDailyMetric,
  type DailyMetricDraft,
  type DailyMetricRecord,
  type MealTypeValue,
} from '../lib/api';
import { DataTable, type Column, FormField, DateInput, StatCard } from '../components';
import { ErrorBoundary } from '../components/error-boundary';
import { toast } from '../lib/toast';

const MEAL_OPTIONS: Array<{ value: MealTypeValue; label: string }> = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '正餐' },
];

const WEATHER_OPTIONS = ['晴', '阴', '雨', '雪', '多云'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyDraft(storeId: string): DailyMetricDraft {
  return {
    storeId,
    date: today(),
    mealType: 'breakfast',
    avgTicketPrice: 0,
    customerCount: 0,
    totalRevenue: null,
    weather: '',
  };
}

function formatMoney(value?: number | null) {
  return value === undefined || value === null ? '-' : `¥${Number(value).toFixed(2)}`;
}

function formatDate(date: string) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const COLUMNS: Column<DailyMetricRecord>[] = [
  { colKey: 'date', title: '日期', sortable: true },
  { colKey: 'mealType', title: '餐别', width: 80 },
  {
    colKey: 'storeName',
    title: '门店',
    searchable: true,
    cell: ({ row }) => row.storeName || row.storeId,
  },
  {
    colKey: 'avgTicketPrice',
    title: '客单价',
    align: 'right',
    sortable: true,
    cell: ({ row }) => formatMoney(row.avgTicketPrice),
  },
  {
    colKey: 'customerCount',
    title: '人数',
    align: 'right',
    sortable: true,
  },
  {
    colKey: 'totalRevenue',
    title: '营业额',
    align: 'right',
    cell: ({ row }) => formatMoney(row.totalRevenue),
  },
  {
    colKey: 'weather',
    title: '天气',
    width: 80,
    cell: ({ row }) => row.weather || '-',
  },
];

function validateDraft(draft: DailyMetricDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.storeId) errors.storeId = '请选择门店';
  if (!draft.date) errors.date = '请选择日期';
  if (draft.avgTicketPrice < 0) errors.avgTicketPrice = '客单价不能为负数';
  if (draft.customerCount < 0) errors.customerCount = '人数不能为负数';
  return errors;
}

function DailyMetricsForm({
  draft,
  onChange,
  storeOptions,
  weatherOptions,
  onSave,
  saving,
  errors,
}: {
  draft: DailyMetricDraft;
  onChange: (draft: DailyMetricDraft) => void;
  storeOptions: Array<{ value: string; label: string }>;
  weatherOptions: Array<{ value: string; label: string }>;
  onSave: () => void;
  saving: boolean;
  errors: Record<string, string>;
}) {
  return (
    <Card
      title="编辑记录"
      subtitle="新建或更新一条经营数据。"
      actions={
        <Button
          theme="primary"
          onClick={onSave}
          loading={saving}
          disabled={!draft.storeId}
        >
          {draft.id ? '更新' : '保存'}
        </Button>
      }
      bordered
    >
      <div className="grid-form">
        <FormField label="门店" required error={errors.storeId}>
          <Select
            value={draft.storeId}
            onChange={(v) => onChange({ ...draft, storeId: v as string })}
            options={storeOptions}
            placeholder="请选择门店"
            clearable={false}
          />
        </FormField>

        <FormField label="日期" required error={errors.date}>
          <DateInput
            value={draft.date}
            onChange={(v) => onChange({ ...draft, date: v })}
          />
        </FormField>

        <FormField label="餐别" required>
          <Select
            value={draft.mealType}
            onChange={(v) =>
              onChange({ ...draft, mealType: v as MealTypeValue })
            }
            options={MEAL_OPTIONS}
            clearable={false}
          />
        </FormField>

        <FormField label="平均客单价" required error={errors.avgTicketPrice} help="单位：元">
          <InputNumber
            value={draft.avgTicketPrice}
            onChange={(v) =>
              onChange({ ...draft, avgTicketPrice: Number(v) })
            }
            min={0}
            decimalPlaces={2}
          />
        </FormField>

        <FormField label="就餐人数" required error={errors.customerCount}>
          <InputNumber
            value={draft.customerCount}
            onChange={(v) =>
              onChange({ ...draft, customerCount: Number(v) })
            }
            min={0}
          />
        </FormField>

        <FormField label="总营业额" help="选填，单位：元">
          <InputNumber
            value={draft.totalRevenue ?? undefined}
            onChange={(v) =>
              onChange({
                ...draft,
                totalRevenue: v === undefined || v === null ? null : Number(v),
              })
            }
            min={0}
            decimalPlaces={2}
          />
        </FormField>

        <FormField label="天气" className="grid-span-2" help="选填">
          <Select
            value={draft.weather || ''}
            onChange={(v) => onChange({ ...draft, weather: v as string })}
            options={[
              { value: '', label: '请选择天气' },
              ...weatherOptions,
            ]}
            clearable={false}
          />
        </FormField>
      </div>
    </Card>
  );
}

export function DailyMetricsPage() {
  const { data: stores = [], error: storesError } = useSWR(
    'metrics-stores',
    fetchStores,
  );
  const [queryStoreId, setQueryStoreId] = useState('');
  const [queryDate, setQueryDate] = useState('');
  const [queryMealType, setQueryMealType] = useState<'' | MealTypeValue>('');
  const [draft, setDraft] = useState<DailyMetricDraft>(createEmptyDraft(''));
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize store selection when stores load
  useEffect(() => {
    if (!queryStoreId && stores.length > 0) {
      setQueryStoreId(stores[0].id);
      setDraft(createEmptyDraft(stores[0].id));
    }
  }, [stores, queryStoreId]);

  const {
    data: items = [],
    isLoading,
    error: metricsError,
    mutate,
  } = useSWR(
    queryStoreId
      ? ['daily-metrics', queryStoreId, queryDate, queryMealType]
      : null,
    () =>
      fetchDailyMetrics({
        storeId: queryStoreId,
        date: queryDate || undefined,
        mealType: queryMealType || undefined,
      }),
  );

  const combinedError =
    storesError || metricsError
      ? new Error(
          storesError
            ? '加载门店数据失败'
            : '加载经营数据失败',
        )
      : null;

  const handleSave = useCallback(async () => {
    const errors = validateDraft(draft);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const saved = await saveDailyMetric(draft);
      toast.success('经营数据已保存');
      setDraft({
        id: saved.id,
        storeId: saved.storeId,
        date: saved.date,
        mealType: saved.mealType,
        avgTicketPrice: saved.avgTicketPrice,
        customerCount: saved.customerCount,
        totalRevenue: saved.totalRevenue ?? null,
        weather: saved.weather ?? '',
      });
      setFormErrors({});
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }, [draft, mutate]);

  const selectRecord = useCallback((record: DailyMetricRecord) => {
    setDraft({
      id: record.id,
      storeId: record.storeId,
      date: record.date,
      mealType: record.mealType,
      avgTicketPrice: record.avgTicketPrice,
      customerCount: record.customerCount,
      totalRevenue: record.totalRevenue ?? null,
      weather: record.weather ?? '',
    });
    setFormErrors({});
  }, []);

  const storeOptions = useMemo(
    () => stores.map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );
  const weatherOptions = useMemo(
    () => WEATHER_OPTIONS.map((w) => ({ value: w, label: w })),
    [],
  );

  // Stats
  const stats = useMemo(() => {
    if (!items.length) return null;
    const avgTicket =
      items.reduce((sum, item) => sum + Number(item.avgTicketPrice || 0), 0) /
      items.length;
    const totalCustomers = items.reduce(
      (sum, item) => sum + Number(item.customerCount || 0),
      0,
    );
    const totalRevenue = items.reduce(
      (sum, item) => sum + Number(item.totalRevenue || 0),
      0,
    );
    return { avgTicket, totalCustomers, totalRevenue };
  }, [items]);

  const allColumns: Column<DailyMetricRecord>[] = useMemo(
    () => [
      ...COLUMNS,
      {
        colKey: 'action',
        title: '操作',
        width: 100,
        cell: ({ row }) => (
          <Button
            size="small"
            variant="outline"
            onClick={() => selectRecord(row)}
          >
            编辑
          </Button>
        ),
      },
    ],
    [selectRecord],
  );

  return (
    <ErrorBoundary>
      <div className="page-stack">
        {/* Stats */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem',
            }}
          >
            <StatCard
              title="平均客单价"
              value={stats.avgTicket.toFixed(2)}
              prefix="¥"
              color="var(--td-brand-color)"
            />
            <StatCard
              title="总就餐人数"
              value={stats.totalCustomers}
              suffix="人"
              color="var(--td-success-color)"
            />
            <StatCard
              title="总营业额"
              value={stats.totalRevenue.toFixed(2)}
              prefix="¥"
              color="var(--td-warning-color)"
            />
          </div>
        )}

        {/* Filter Card */}
        <Card
          title="筛选条件"
          actions={
            <Tag theme="default">
              共 {items.length} 条
            </Tag>
          }
          bordered
        >
          <div className="grid-form">
            <FormField label="门店">
              <Select
                value={queryStoreId}
                onChange={(v) => {
                  setQueryStoreId(v as string);
                  setFormErrors({});
                }}
                options={storeOptions}
                placeholder="请选择门店"
                clearable={false}
              />
            </FormField>
            <FormField label="日期">
              <DateInput
                value={queryDate}
                onChange={setQueryDate}
              />
            </FormField>
            <FormField label="餐别">
              <Select
                value={queryMealType}
                onChange={(v) =>
                  setQueryMealType(v as '' | MealTypeValue)
                }
                options={[
                  { value: '', label: '全部' },
                  ...MEAL_OPTIONS,
                ]}
                clearable={false}
              />
            </FormField>
          </div>
        </Card>

        {/* Editor */}
        <DailyMetricsForm
          draft={draft}
          onChange={setDraft}
          storeOptions={storeOptions}
          weatherOptions={weatherOptions}
          onSave={handleSave}
          saving={saving}
          errors={formErrors}
        />

        {/* Data Table */}
        <Card title="数据列表" bordered>
          <DataTable<DailyMetricRecord>
            columns={allColumns}
            data={items}
            loading={isLoading}
            error={combinedError}
            rowKey="id"
            emptyText="暂无经营数据"
            emptyDescription="请先创建经营数据记录"
            pageSize={10}
            onRefresh={() => mutate()}
          />
        </Card>
      </div>
    </ErrorBoundary>
  );
}
