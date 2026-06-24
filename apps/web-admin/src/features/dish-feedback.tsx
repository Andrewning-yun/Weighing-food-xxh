import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import Select from 'tdesign-react/es/select';
import Textarea from 'tdesign-react/es/textarea';
import Tag from 'tdesign-react/es/tag';
import {
  fetchDishes,
  fetchDishFeedback,
  fetchStores,
  saveDishFeedback,
  type DishFeedbackDraft,
  type DishFeedbackRecord,
  type LeftoverLevelValue,
  type MealTypeValue,
} from '../lib/api';
import { DataTable, type Column } from '../components/data-table';
import { toast } from '../lib/toast';

const MEAL_OPTIONS: Array<{ value: MealTypeValue; label: string }> = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '正餐' },
];

const LEFTOVER_OPTIONS: Array<{ value: LeftoverLevelValue; label: string }> = [
  { value: 'none', label: '无剩余' }, { value: 'low', label: '少量剩余' },
  { value: 'medium', label: '中等剩余' }, { value: 'high', label: '剩余较多' },
];

function today() { return new Date().toISOString().slice(0, 10); }

function createEmptyDraft(storeId: string, dishId: string): DishFeedbackDraft {
  return { storeId, date: today(), mealType: 'breakfast', dishId, leftoverLevel: 'none', note: '' };
}

const COLUMNS: Column<DishFeedbackRecord>[] = [
  { colKey: 'date', title: '日期' },
  { colKey: 'mealType', title: '餐段' },
  { colKey: 'storeName', title: '门店', cell: ({ row }) => row.storeName || row.storeId },
  { colKey: 'dishName', title: '菜品', cell: ({ row }) => row.dishName || row.dishId },
  { colKey: 'leftoverLevel', title: '剩余等级' },
  { colKey: 'note', title: '备注', cell: ({ row }) => row.note || '-' },
];

export function DishFeedbackPage() {
  const { data: stores = [] } = useSWR('feedback-stores', fetchStores);
  const { data: dishes = [] } = useSWR('feedback-dishes', fetchDishes);
  const [queryStoreId, setQueryStoreId] = useState('');
  const [queryDate, setQueryDate] = useState('');
  const [queryMealType, setQueryMealType] = useState<'' | MealTypeValue>('');
  const [draft, setDraft] = useState<DishFeedbackDraft>(createEmptyDraft('', ''));
  const [saving, setSaving] = useState(false);

  const { data: items = [], isLoading, mutate } = useSWR(
    queryStoreId ? ['dish-feedback', queryStoreId, queryDate, queryMealType] : null,
    () => fetchDishFeedback({ storeId: queryStoreId, date: queryDate || undefined, mealType: queryMealType || undefined }),
  );

  // Set initial store and draft
  if (!queryStoreId && stores.length > 0) {
    const store = stores[0];
    setQueryStoreId(store.id);
    if (dishes[0]) setDraft(createEmptyDraft(store.id, dishes[0].id));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveDishFeedback(draft);
      toast.success('菜品反馈已保存');
      setDraft({ id: saved.id, storeId: saved.storeId, date: saved.date, mealType: saved.mealType, dishId: saved.dishId, leftoverLevel: saved.leftoverLevel, note: saved.note ?? '' });
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存菜品反馈失败');
    } finally {
      setSaving(false);
    }
  }

  function selectRecord(record: DishFeedbackRecord) {
    setDraft({ id: record.id, storeId: record.storeId, date: record.date, mealType: record.mealType, dishId: record.dishId, leftoverLevel: record.leftoverLevel, note: record.note ?? '' });
  }

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));
  const dishOptions = dishes.map((d) => ({ value: d.id, label: d.name }));

  const allColumns: Column<DishFeedbackRecord>[] = [
    ...COLUMNS,
    { colKey: 'action', title: '操作', width: 100, cell: ({ row }) => <Button size="small" variant="outline" onClick={() => selectRecord(row)}>编辑</Button> },
  ];

  return (
    <div className="page-stack">
      <Card title="菜品反馈" subtitle="记录每道菜品的剩余等级和备注。" actions={<Tag theme="default">{items.length} 条</Tag>} bordered>
        <div className="grid-form">
          <label><span>门店</span>
            <Select value={queryStoreId} onChange={(v) => setQueryStoreId(v as string)} options={storeOptions} placeholder="选择门店" clearable={false} /></label>
          <label><span>日期</span>
            <input type="date" value={queryDate} onChange={(e) => setQueryDate(e.target.value)}
              style={{ width: '100%', borderRadius: 'var(--td-radius-default, 6px)', border: '1px solid var(--td-component-border)', padding: '5px 8px', height: 32, fontSize: '0.9rem', background: 'var(--td-bg-color-container)' }} /></label>
          <label><span>餐段</span>
            <Select value={queryMealType} onChange={(v) => setQueryMealType(v as '' | MealTypeValue)} options={[{ value: '', label: '全部' }, ...MEAL_OPTIONS]} clearable={false} /></label>
          <label><span>菜品数</span>
            <Input value={String(dishes.length)} readonly /></label>
        </div>
      </Card>

      <Card title="编辑器" subtitle="记录菜品表现和剩余信号。"
        actions={<Button theme="primary" onClick={handleSave} loading={saving} disabled={!draft.storeId || !draft.dishId}>{draft.id ? '更新反馈' : '保存反馈'}</Button>} bordered>
        <div className="grid-form">
          <label><span>门店</span>
            <Select value={draft.storeId} onChange={(v) => setDraft((c) => ({ ...c, storeId: v as string }))} options={storeOptions} placeholder="选择门店" clearable={false} /></label>
          <label><span>日期</span>
            <input type="date" value={draft.date} onChange={(e) => setDraft((c) => ({ ...c, date: e.target.value }))}
              style={{ width: '100%', borderRadius: 'var(--td-radius-default, 6px)', border: '1px solid var(--td-component-border)', padding: '5px 8px', height: 32, fontSize: '0.9rem', background: 'var(--td-bg-color-container)' }} /></label>
          <label><span>餐段</span>
            <Select value={draft.mealType} onChange={(v) => setDraft((c) => ({ ...c, mealType: v as MealTypeValue }))} options={MEAL_OPTIONS} clearable={false} /></label>
          <label><span>菜品</span>
            <Select value={draft.dishId} onChange={(v) => setDraft((c) => ({ ...c, dishId: v as string }))} options={dishOptions} placeholder="选择菜品" clearable={false} /></label>
          <label><span>剩余等级</span>
            <Select value={draft.leftoverLevel} onChange={(v) => setDraft((c) => ({ ...c, leftoverLevel: v as LeftoverLevelValue }))} options={LEFTOVER_OPTIONS} clearable={false} /></label>
          <label className="grid-span-2"><span>备注</span>
            <Textarea value={draft.note || ''} onChange={(v) => setDraft((c) => ({ ...c, note: v as string }))} /></label>
        </div>
      </Card>

      <Card title="列表" subtitle="菜品反馈列表。" bordered>
        <DataTable<DishFeedbackRecord>
          columns={allColumns}
          data={items}
          loading={isLoading}
          rowKey="id"
          emptyText="暂无菜品反馈数据"
          pageSize={10}
        />
      </Card>
    </div>
  );
}
