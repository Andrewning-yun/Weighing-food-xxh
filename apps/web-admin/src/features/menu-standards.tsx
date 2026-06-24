import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import InputNumber from 'tdesign-react/es/input-number';
import Select from 'tdesign-react/es/select';
import Tag from 'tdesign-react/es/tag';
import {
  fetchMenuStandards,
  fetchStores,
  saveMenuStandards,
  type MealTypeValue,
  type MenuStandardDraft,
  type MenuStandardRecord,
} from '../lib/api';
import { DataTable, type Column } from '../components/data-table';
import { toast } from '../lib/toast';

const MEAL_OPTIONS: Array<{ value: MealTypeValue; label: string }> = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '正餐' },
];

const DEFAULT_CATEGORIES = ['蒸菜', '炒菜', '砂锅', '凉菜', '汤品', '小吃', '饮品'];

function createDefaultDraft(storeId: string, mealType: MealTypeValue): MenuStandardDraft[] {
  return DEFAULT_CATEGORIES.map((categoryName) => ({
    storeId,
    mealType,
    categoryName,
    requiredCount: 1,
  }));
}

const COLUMNS: Column<MenuStandardRecord>[] = [
  { colKey: 'categoryName', title: '分类' },
  { colKey: 'requiredCount', title: '最少' },
  { colKey: 'mealType', title: '餐段' },
];

export function MenuStandardsPage() {
  const { data: stores = [] } = useSWR('standards-stores', fetchStores);
  const [queryStoreId, setQueryStoreId] = useState('');
  const [queryMealType, setQueryMealType] = useState<MealTypeValue>('breakfast');
  const [drafts, setDrafts] = useState<MenuStandardDraft[]>(createDefaultDraft('', 'breakfast'));
  const [saving, setSaving] = useState(false);

  const { data: records = [], isLoading, mutate } = useSWR(
    queryStoreId ? ['menu-standards', queryStoreId, queryMealType] : null,
    () => fetchMenuStandards({ storeId: queryStoreId, mealType: queryMealType }),
    {
      onSuccess: (data) => {
        setDrafts(
          data.length > 0
            ? data.map((item) => ({
                storeId: item.storeId,
                mealType: item.mealType,
                categoryName: item.categoryName,
                requiredCount: item.requiredCount,
              }))
            : createDefaultDraft(queryStoreId, queryMealType),
        );
      },
      onError: () => {
        setDrafts(createDefaultDraft(queryStoreId, queryMealType));
      },
    },
  );

  // Set initial store on first load
  if (!queryStoreId && stores.length > 0) {
    setQueryStoreId(stores[0].id);
    setDrafts(createDefaultDraft(stores[0].id, queryMealType));
  }

  const currentStore = useMemo(
    () => stores.find((store) => store.id === queryStoreId) || null,
    [queryStoreId, stores],
  );

  const recordsWithKey = useMemo(
    () => records.map((r) => ({ ...r, _key: `${r.storeId}-${r.mealType}-${r.categoryName}` })),
    [records],
  );

  async function handleSave() {
    setSaving(true);
    try {
      await saveMenuStandards(
        drafts.map((item) => ({
          storeId: queryStoreId,
          mealType: queryMealType,
          categoryName: item.categoryName,
          requiredCount: Number(item.requiredCount || 0),
        })),
      );
      toast.success('菜单标准已保存');
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存菜单标准失败');
    } finally {
      setSaving(false);
    }
  }

  const storeOptions = stores.map((store) => ({ value: store.id, label: store.name }));

  return (
    <div className="page-stack">
      <Card title="菜单标准" subtitle="按分类配置所需菜品数量。"
        actions={<Button theme="primary" onClick={handleSave} loading={saving} disabled={!queryStoreId}>保存标准</Button>} bordered>
        <div className="grid-form">
          <label>
            <span>门店</span>
            <Select value={queryStoreId} onChange={(v) => setQueryStoreId(v as string)} options={storeOptions} placeholder="选择门店" clearable={false} />
          </label>
          <label>
            <span>餐段</span>
            <Select value={queryMealType} onChange={(v) => setQueryMealType(v as MealTypeValue)} options={MEAL_OPTIONS} clearable={false} />
          </label>
          <label>
            <span>门店名称</span>
            <Input value={currentStore?.name || ''} readonly />
          </label>
          <label>
            <span>规则数</span>
            <Input value={String(drafts.length)} readonly />
          </label>
        </div>
      </Card>

      <Card title="编辑器" subtitle="编辑所选门店和餐段的各分类目标数量。"
        actions={<Button variant="outline" onClick={() => setDrafts((current) => [...current, { storeId: queryStoreId, mealType: queryMealType, categoryName: '', requiredCount: 1 }])}>添加分类</Button>} bordered>
        <div className="stack-list">
          {drafts.map((item, index) => (
            <div key={`${item.categoryName || 'new'}-${index}`} className="nested-card">
              <div className="inline-grid inline-grid-3">
                <label>
                  <span>分类名称</span>
                  <Input value={item.categoryName} onChange={(v) => setDrafts((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, categoryName: v as string } : row))} />
                </label>
                <label>
                  <span>最少数量</span>
                  <InputNumber value={item.requiredCount} onChange={(v) => setDrafts((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, requiredCount: Number(v) } : row))} min={0} />
                </label>
                <label>
                  <span>餐段</span>
                  <Input value={item.mealType} readonly />
                </label>
              </div>
              <div className="row-split">
                <span className="muted">门店级和餐段级规则</span>
                <Button size="small" theme="danger" variant="outline" onClick={() => setDrafts((current) => current.filter((_, rowIndex) => rowIndex !== index))}>移除</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="当前配置" subtitle="已保存的标准配置项。" actions={<Tag theme="default">{records.length} 条</Tag>} bordered>
        <DataTable<MenuStandardRecord>
          columns={COLUMNS}
          data={records}
          loading={isLoading}
          rowKey="_key"
          showPagination={false}
          emptyText="暂无已保存的菜单标准"
        />
      </Card>
    </div>
  );
}
