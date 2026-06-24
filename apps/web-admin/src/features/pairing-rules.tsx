import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import InputNumber from 'tdesign-react/es/input-number';
import Select from 'tdesign-react/es/select';
import Tag from 'tdesign-react/es/tag';
import {
  fetchMenuPairingRules,
  fetchStores,
  saveMenuPairingRules,
  type MealTypeValue,
  type MenuPairingRuleDraft,
  type MenuPairingRuleRecord,
} from '../lib/api';
import { DataTable, type Column } from '../components/data-table';
import { toast } from '../lib/toast';

const MEAL_OPTIONS: Array<{ value: MealTypeValue; label: string }> = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '正餐' },
];

const TAG_OPTIONS = ['大荤', '小荤', '素菜'];
const TAG_SELECT_OPTIONS = TAG_OPTIONS.map((t) => ({ value: t, label: t }));

function getMealLabel(mealType: string): string {
  return MEAL_OPTIONS.find((o) => o.value === mealType)?.label ?? mealType;
}

function createDefaultDraft(storeId: string, mealType: MealTypeValue): MenuPairingRuleDraft[] {
  return TAG_OPTIONS.map((tagName) => ({
    storeId,
    mealType,
    tagName,
    minCount: 0,
    maxCount: null,
  }));
}

const COLUMNS: Column<MenuPairingRuleRecord>[] = [
  { colKey: 'tagName', title: '标签' },
  { colKey: 'minCount', title: '最少' },
  { colKey: 'maxCount', title: '最多', cell: ({ row }) => row.maxCount ?? '-' },
  { colKey: 'mealType', title: '餐段', cell: ({ row }) => getMealLabel(row.mealType) },
];

export function MenuPairingRulesPage() {
  const { data: stores = [] } = useSWR('pairing-stores', fetchStores);
  const [queryStoreId, setQueryStoreId] = useState('');
  const [queryMealType, setQueryMealType] = useState<MealTypeValue>('breakfast');
  const [drafts, setDrafts] = useState<MenuPairingRuleDraft[]>(createDefaultDraft('', 'breakfast'));
  const [saving, setSaving] = useState(false);

  const { data: records = [], isLoading, mutate } = useSWR(
    queryStoreId ? ['pairing-rules', queryStoreId, queryMealType] : null,
    () => fetchMenuPairingRules({ storeId: queryStoreId, mealType: queryMealType }),
    {
      onSuccess: (data) => {
        setDrafts(
          data.length > 0
            ? data.map((item) => ({
                storeId: item.storeId,
                mealType: item.mealType,
                tagName: item.tagName,
                minCount: item.minCount,
                maxCount: item.maxCount ?? null,
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
  const storeInit = useMemo(() => {
    if (!queryStoreId && stores.length > 0) {
      setQueryStoreId(stores[0].id);
      setDrafts(createDefaultDraft(stores[0].id, queryMealType));
    }
    return null;
  }, [stores, queryStoreId, queryMealType]);
  void storeInit; // suppress unused var

  const currentStore = useMemo(
    () => stores.find((store) => store.id === queryStoreId) || null,
    [queryStoreId, stores],
  );

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveMenuPairingRules(
        drafts.map((item) => ({
          storeId: queryStoreId,
          mealType: queryMealType,
          tagName: item.tagName,
          minCount: Number(item.minCount || 0),
          maxCount: item.maxCount === undefined || item.maxCount === null ? null : Number(item.maxCount),
        })),
      );
      toast.success('搭配规则已保存');
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存搭配规则失败');
    } finally {
      setSaving(false);
    }
  }

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="page-stack">
      <Card title="搭配规则" subtitle="设置大荤/小荤/素菜的最少与最多数量。"
        actions={<Button theme="primary" onClick={handleSave} loading={saving} disabled={!queryStoreId}>保存搭配规则</Button>} bordered>
        <div className="grid-form">
          <label>
            <span className="detail-label">门店</span>
            <Select value={queryStoreId || undefined} onChange={(v) => setQueryStoreId(v as string)} options={storeOptions} placeholder="选择门店" clearable={false} />
          </label>
          <label>
            <span className="detail-label">餐段</span>
            <Select value={queryMealType} onChange={(v) => setQueryMealType(v as MealTypeValue)} options={MEAL_OPTIONS} clearable={false} />
          </label>
          <label>
            <span className="detail-label">门店名称</span>
            <Input value={currentStore?.name || ''} readonly />
          </label>
          <label>
            <span className="detail-label">规则数</span>
            <Input value={String(drafts.length)} readonly />
          </label>
        </div>
      </Card>

      <Card title="编辑器" subtitle="编辑当前门店和餐段下各标签的数量要求。"
        actions={
          <Button variant="outline" onClick={() =>
            setDrafts((current) => [
              ...current,
              { storeId: queryStoreId, mealType: queryMealType, tagName: '大荤', minCount: 0, maxCount: null },
            ])
          }>添加规则</Button>
        } bordered>
        <div className="stack-list">
          {drafts.map((item, index) => (
            <div key={`${item.tagName}-${index}`} className="nested-card">
              <div className="inline-grid inline-grid-4">
                <label>
                  <span className="detail-label">标签</span>
                  <Select
                    value={item.tagName}
                    onChange={(v) =>
                      setDrafts((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, tagName: v as string } : row,
                        ),
                      )
                    }
                    options={TAG_SELECT_OPTIONS}
                    clearable={false}
                  />
                </label>
                <label>
                  <span className="detail-label">最少</span>
                  <InputNumber
                    value={item.minCount}
                    onChange={(v) =>
                      setDrafts((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, minCount: Number(v) } : row,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  <span className="detail-label">最多</span>
                  <InputNumber
                    value={item.maxCount ?? ('' as unknown as number)}
                    onChange={(v) =>
                      setDrafts((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? { ...row, maxCount: v === undefined || v === null || v === '' ? null : Number(v) }
                            : row,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  <span className="detail-label">餐段</span>
                  <Input value={getMealLabel(item.mealType)} readonly />
                </label>
              </div>
              <div className="row-split">
                <span className="muted">门店级搭配规则</span>
                <Button size="small" theme="danger" variant="outline" onClick={() => setDrafts((current) => current.filter((_, rowIndex) => rowIndex !== index))}>移除</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="已保存规则" subtitle="当前已配置的搭配规则。" actions={<Tag theme="default">{records.length} 条规则</Tag>} bordered>
        <DataTable<MenuPairingRuleRecord>
          columns={COLUMNS}
          data={records}
          loading={isLoading}
          rowKey="tagName"
          showPagination={false}
          emptyText="暂无已保存的搭配规则"
        />
      </Card>
    </div>
  );
}
