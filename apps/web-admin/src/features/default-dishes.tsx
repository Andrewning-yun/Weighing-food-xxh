import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Select from 'tdesign-react/es/select';
import Tag from 'tdesign-react/es/tag';
import Space from 'tdesign-react/es/space';
import {
  fetchDefaultDishes,
  fetchDishes,
  saveDefaultDishes,
  type DefaultDishRecord,
  type DishRecord,
  type MealTypeValue,
  type WeekdayValue,
} from '../lib/api';
import { useStoreContext } from '../lib/store';
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
  const { data: dishes = [] } = useSWR('defaultdish-dishes', fetchDishes);

  const { storeId: queryStoreId, storeName } = useStoreContext();
  const [queryMealType, setQueryMealType] = useState<MealTypeValue>('breakfast');
  const [queryDayOfWeek, setQueryDayOfWeek] = useState<WeekdayValue>(1);
  const [records, setRecords] = useState<DefaultDishRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [dishSearch, setDishSearch] = useState('');
  const [selectedDishId, setSelectedDishId] = useState<string | undefined>(undefined);

  const { isLoading, mutate } = useSWR(
    queryStoreId ? ['default-dishes', queryStoreId, queryMealType, queryDayOfWeek] : null,
    () => fetchDefaultDishes({ storeId: queryStoreId, mealType: queryMealType, dayOfWeek: queryDayOfWeek }),
    {
      onSuccess: (data) => setRecords(data),
      onError: (err) => toast.error(err instanceof Error ? err.message : '加载默认菜品失败'),
    },
  );

  const dishOptions = useMemo(() => {
    const term = dishSearch.trim().toLowerCase();
    if (!term) return [];
    return dishes
      .filter(
        (dish) =>
          dish.name.toLowerCase().includes(term) ||
          dish.category.toLowerCase().includes(term) ||
          (dish.dishTypeTag || '').toLowerCase().includes(term),
      )
      .slice(0, 20)
      .map((dish) => ({
        value: dish.id,
        label: `${dish.name}（${dish.category}）`,
        dish,
      }));
  }, [dishes, dishSearch]);

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

  return (
    <div className="page-stack">
      <Card title="默认菜品" subtitle="管理各门店和餐段的每日固定菜品。"
        actions={<Button theme="primary" onClick={handleSave} loading={saving} disabled={!queryStoreId}>保存白名单</Button>} bordered>
        <div className="grid-form">
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
            <div style={{
              padding: '5px 8px',
              border: '1px solid var(--td-component-border)',
              borderRadius: 'var(--td-radius-default, 6px)',
              minHeight: 32,
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.9rem',
            }}>
              {storeName || '-'}
            </div>
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

      <Card title="菜品选择" subtitle="输入菜品名称自动检索，从下拉中选择添加为固定菜品。" bordered>
        <Select
          filterable
          clearable
          placeholder="输入菜品名称或分类检索..."
          value={selectedDishId}
          options={dishOptions}
          empty="输入名称后展示匹配菜品"
          onSearch={(v) => setDishSearch((v as string) || '')}
          onChange={(v) => {
            const dish = dishes.find((item) => item.id === v);
            if (dish) addDish(dish);
            setSelectedDishId(undefined);
            setDishSearch('');
          }}
          style={{ width: '100%' }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--td-text-color-placeholder)' }}>
          提示：输入 1 个字以上开始检索，最多展示 20 个匹配菜品
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
                <div><span className="detail-label">门店</span><strong>{storeName || record.storeId}</strong></div>
              </div>
            </div>
          ))}
          {records.length === 0 && <p className="muted">暂无固定菜品，请从上方菜品选择中添加</p>}
        </div>
      </Card>
    </div>
  );
}
