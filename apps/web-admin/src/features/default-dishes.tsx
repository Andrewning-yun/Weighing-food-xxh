import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import Select from 'tdesign-react/es/select';
import Table from 'tdesign-react/es/table';
import Tag from 'tdesign-react/es/tag';
import Space from 'tdesign-react/es/space';
import {
  fetchDefaultDishes,
  fetchDishes,
  fetchStores,
  saveDefaultDishes,
  type DefaultDishRecord,
  type DishRecord,
  type MealTypeValue,
  type StoreRecord,
  type WeekdayValue,
} from '../lib/api';
import { toast } from '../lib/toast';

const MEAL_OPTIONS: Array<{ value: MealTypeValue; label: string }> = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '正餐' },
];

const WEEKDAY_OPTIONS: Array<{ value: WeekdayValue; label: string }> = [
  { value: 1, label: '周一' }, { value: 2, label: '周二' }, { value: 3, label: '周三' },
  { value: 4, label: '周四' }, { value: 5, label: '周五' }, { value: 6, label: '周六' },
  { value: 7, label: '周日' },
];

function getWeekdayLabel(value: WeekdayValue) {
  return WEEKDAY_OPTIONS.find((item) => item.value === value)?.label || String(value);
}

export function DefaultDishesPage() {
  const { data: stores = [] } = useSWR('defaultdish-stores', fetchStores);
  const { data: dishes = [] } = useSWR('defaultdish-dishes', fetchDishes);

  const [queryStoreId, setQueryStoreId] = useState('');
  const [queryMealType, setQueryMealType] = useState<MealTypeValue>('breakfast');
  const [queryDayOfWeek, setQueryDayOfWeek] = useState<WeekdayValue>(1);
  const [records, setRecords] = useState<DefaultDishRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const { isLoading, mutate } = useSWR(
    queryStoreId ? ['default-dishes', queryStoreId, queryMealType, queryDayOfWeek] : null,
    () => fetchDefaultDishes({ storeId: queryStoreId, mealType: queryMealType, dayOfWeek: queryDayOfWeek }),
    {
      onSuccess: (data) => setRecords(data),
      onError: (err) => toast.error(err instanceof Error ? err.message : '加载默认菜品失败'),
    },
  );

  // Set initial store
  if (!queryStoreId && stores.length > 0) {
    setQueryStoreId(stores[0].id);
  }

  const currentStore = useMemo(
    () => stores.find((store) => store.id === queryStoreId) || null,
    [queryStoreId, stores],
  );

  const filteredDishes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return dishes.filter((dish) => !term || dish.name.toLowerCase().includes(term) || dish.category.toLowerCase().includes(term));
  }, [dishes, search]);

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveDefaultDishes(
        records.map((item) => ({
          storeId: queryStoreId,
          mealType: queryMealType,
          dayOfWeek: queryDayOfWeek,
          dishId: item.dishId,
        })),
      );
      setRecords(saved);
      toast.success('默认菜品已保存');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存默认菜品失败');
    } finally {
      setSaving(false);
    }
  }

  function addDish(dish: DishRecord) {
    setRecords((current) =>
      current.some((item) => item.dishId === dish.id)
        ? current
        : [...current, { storeId: queryStoreId, mealType: queryMealType, dayOfWeek: queryDayOfWeek, dishId: dish.id, dishName: dish.name }],
    );
  }

  function removeDish(dishId: string) {
    setRecords((current) => current.filter((item) => item.dishId !== dishId));
  }

  const storeOptions = stores.map((store) => ({ value: store.id, label: store.name }));

  return (
    <div className="page-stack">
      <Card title="默认菜品" subtitle="管理各门店和餐段的每日固定菜品。"
        actions={<Button theme="primary" onClick={handleSave} loading={saving} disabled={!queryStoreId}>保存白名单</Button>} bordered>
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
            <span>星期</span>
            <Select value={queryDayOfWeek} onChange={(v) => setQueryDayOfWeek(Number(v) as WeekdayValue)} options={WEEKDAY_OPTIONS} clearable={false} />
          </label>
          <label>
            <span>门店名称</span>
            <Input value={currentStore?.name || ''} readonly />
          </label>
        </div>

        <Space style={{ flexWrap: 'wrap' }}>
          {WEEKDAY_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={queryDayOfWeek === option.value ? 'base' : 'outline'}
              theme={queryDayOfWeek === option.value ? 'primary' : 'default'}
              onClick={() => setQueryDayOfWeek(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title="菜品选择" subtitle="搜索菜品目录，添加当日固定菜品。" bordered>
        <Input value={search} onChange={(v) => setSearch(v as string)} placeholder="搜索菜品名称或分类" style={{ marginBottom: 12 }} />
        <div className="table-shell">
          <Table
            resizable
            data={filteredDishes}
            columns={[
              { colKey: 'name', title: '名称' },
              { colKey: 'category', title: '分类' },
              { colKey: 'mealType', title: '餐段', cell: ({ row }) => (row as DishRecord).mealType || '正餐' },
              { colKey: 'dishTypeTag', title: '标签', cell: ({ row }) => (row as DishRecord).dishTypeTag || '自动判定' },
              {
                colKey: 'action', title: '操作',
                cell: ({ row }) => {
                  const dish = row as DishRecord;
                  const added = records.some((item) => item.dishId === dish.id);
                  return <Button size="small" variant="outline" onClick={() => addDish(dish)} disabled={added}>{added ? '已添加' : '添加'}</Button>;
                },
              },
            ]}
            rowKey="id"
            size="small"
            hover
            stripe
          />
        </div>
      </Card>

      <Card title="当前日期" subtitle="当前筛选条件下的固定菜品。" actions={<Tag theme="default">{records.length} 道菜</Tag>} bordered>
        <div className="stack-list">
          {records.map((record) => (
            <div key={record.dishId} className="nested-card">
              <div className="row-split">
                <strong>{record.dishName || record.dishId}</strong>
                <Button size="small" theme="danger" variant="outline" onClick={() => removeDish(record.dishId)}>移除</Button>
              </div>
              <div className="detail-grid">
                <div><span className="detail-label">餐段</span><strong>{record.mealType}</strong></div>
                <div><span className="detail-label">星期</span><strong>{getWeekdayLabel(queryDayOfWeek)}</strong></div>
                <div><span className="detail-label">菜品ID</span><strong>{record.dishId}</strong></div>
                <div><span className="detail-label">门店</span><strong>{currentStore?.name || record.storeId}</strong></div>
              </div>
            </div>
          ))}
          {records.length === 0 && <p className="muted">暂无固定菜品，请从上方菜品选择中添加</p>}
        </div>
      </Card>
    </div>
  );
}
