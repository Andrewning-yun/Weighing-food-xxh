import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import InputNumber from 'tdesign-react/es/input-number';
import Select from 'tdesign-react/es/select';
import Textarea from 'tdesign-react/es/textarea';
import Table from 'tdesign-react/es/table';
import Tag from 'tdesign-react/es/tag';
import Space from 'tdesign-react/es/space';
import {
  fetchDishes,
  fetchIngredients,
  removeDish,
  saveDish,
  type DishAuditSubmission,
  type DishDraft,
  type DishIngredientDraft,
  type DishRecord,
  type DishStepDraft,
  type DishTypeTagValue,
  type IngredientRecord,
} from '../lib/api';
import { toast } from '../lib/toast';

const CATEGORY_OPTIONS = [
  { value: 'steam', label: '蒸菜' }, { value: 'panfry', label: '煎扒' }, { value: 'fry', label: '油炸' },
  { value: 'casserole', label: '砂锅' }, { value: 'stir', label: '炒菜' }, { value: 'fruit', label: '水果' },
  { value: 'cold', label: '凉菜' }, { value: 'soup', label: '例汤' }, { value: 'tea', label: '茶饮' },
  { value: 'porridge', label: '粥品' }, { value: 'pastry', label: '面点' }, { value: 'breakfast_drink', label: '饮品' },
];

const STATION_OPTIONS = [
  { value: 'wok', label: '炒锅' },
  { value: 'grill_fry_steam', label: '煎扒蒸菜' },
  { value: 'prep', label: '切配' },
  { value: 'breakfast_wok', label: '早餐炒锅' },
  { value: 'breakfast_assist', label: '早餐副手' },
];

const RECOMMEND_WEIGHT_OPTIONS = [
  { value: 1, label: '普通' }, { value: 2, label: '推荐' }, { value: 3, label: '强推' },
] as const;

const MEAL_TYPE_OPTIONS = [
  { value: 'lunch', label: '午餐' }, { value: 'breakfast', label: '早餐' },
] as const;

const DISH_TYPE_TAG_OPTIONS: Array<{ value: '' | DishTypeTagValue; label: string }> = [
  { value: '', label: '自动判定' }, { value: '大荤', label: '大荤' }, { value: '小荤', label: '小荤' }, { value: '素菜', label: '素菜' },
];

const EMPTY_INGREDIENT: DishIngredientDraft = { ingredientId: '', quantity: 0, unit: 'kg', wasteRate: 0 };
const EMPTY_STEP: DishStepDraft = { id: 1, title: '', description: '', duration: 0, station: 'wok' };
const EMPTY_DISH: DishDraft = {
  name: '', category: 'steam', station: 'wok', description: '', coverImageUrl: '', ingredientCost: 0,
  status: 'draft', ingredientCount: 0, ingredients: [{ ...EMPTY_INGREDIENT }], steps: [{ ...EMPTY_STEP }],
  mealType: 'lunch', recommendWeight: 1, relatedIngredients: '', dishTypeTag: '',
};

function createDraftFromRecord(record: DishRecord): DishDraft {
  return {
    id: record.id, name: record.name, category: record.category, station: record.station,
    description: record.description, coverImageUrl: record.coverImageUrl, ingredientCost: record.ingredientCost,
    status: record.status, ingredientCount: record.ingredientCount,
    ingredients: record.ingredients.length > 0 ? record.ingredients : [{ ...EMPTY_INGREDIENT }],
    steps: record.steps.length > 0 ? record.steps : [{ ...EMPTY_STEP }],
    mealType: record.mealType || 'lunch', recommendWeight: record.recommendWeight || 1,
    relatedIngredients: record.relatedIngredients || '', dishTypeTag: record.dishTypeTag || '',
  };
}

function getDishTypeTagLabel(value?: string) {
  return DISH_TYPE_TAG_OPTIONS.find((o) => o.value === value)?.label || '自动判定';
}

export function DishesPage() {
  const { data: items = [], isLoading, mutate } = useSWR('dishes', fetchDishes);
  const { data: ingredients = [] } = useSWR('dish-ingredients', fetchIngredients);
  const [draft, setDraft] = useState<DishDraft>(EMPTY_DISH);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [mealFilter, setMealFilter] = useState<'all' | 'breakfast' | 'lunch'>('all');

  const resolvedIngredientCount = draft.ingredients.filter((item) => item.ingredientId).length;

  const filteredItems = useMemo(() => {
    if (mealFilter === 'all') return items;
    return items.filter((item) => (item.mealType || 'lunch') === mealFilter);
  }, [items, mealFilter]);

  function updateIngredient(index: number, patch: Partial<DishIngredientDraft>) {
    setDraft((c) => ({ ...c, ingredients: c.ingredients.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  }

  function updateStep(index: number, patch: Partial<DishStepDraft>) {
    setDraft((c) => ({ ...c, steps: c.steps.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  }

  function handleSelectDish(record: DishRecord) { setDraft(createDraftFromRecord(record)); }

  function handleCreateNew() {
    setDraft({ ...EMPTY_DISH, mealType: mealFilter === 'all' ? 'lunch' : mealFilter, ingredients: [{ ...EMPTY_INGREDIENT }], steps: [{ ...EMPTY_STEP }] });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const normalizedDraft: DishDraft = {
        ...draft, ingredientCount: resolvedIngredientCount,
        ingredients: draft.ingredients.filter((item) => item.ingredientId).map((item) => ({
          ingredientId: item.ingredientId, quantity: Number(item.quantity), unit: item.unit || 'kg', wasteRate: Number(item.wasteRate),
        })),
        steps: draft.steps.filter((item) => item.title.trim() || item.description.trim()).map((item, index) => ({
          id: index + 1, title: item.title.trim() || `步骤 ${index + 1}`, description: item.description.trim(), duration: Number(item.duration), station: item.station || draft.station,
        })),
      };
      const saved = await saveDish(normalizedDraft);
      if ('auditSubmitted' in saved) {
        toast.success(saved.message || '已提交审核');
        setDraft(EMPTY_DISH);
      } else {
        setDraft(createDraftFromRecord(saved));
        toast.success('菜品已保存');
      }
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存菜品失败');
    } finally { setSaving(false); }
  }

  async function handleRemove() {
    if (!draft.id) { handleCreateNew(); return; }
    setRemoving(true);
    try {
      await removeDish(draft.id);
      toast.success('菜品已删除');
      handleCreateNew();
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除菜品失败');
    } finally { setRemoving(false); }
  }

  const stationOptions = STATION_OPTIONS;

  return (
    <div className="page-stack">
      <Card title="餐段筛选" subtitle="按餐段筛选菜品" bordered>
        <Space>
          {[{ value: 'all' as const, label: '全部' }, ...MEAL_TYPE_OPTIONS].map((opt) => (
            <Button key={opt.value} variant={mealFilter === opt.value ? 'base' : 'outline'} theme={mealFilter === opt.value ? 'primary' : 'default'} onClick={() => setMealFilter(opt.value)}>
              {opt.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title="菜品编辑器" subtitle="管理菜品、配方比例和 SOP 执行步骤。"
        actions={
          <Space>
            <Button variant="outline" onClick={handleCreateNew} data-testid="dish-new">新建</Button>
            <Button theme="primary" onClick={handleSave} loading={saving} data-testid="dish-save">保存菜品</Button>
            <Button theme="danger" variant="outline" onClick={handleRemove} loading={removing} data-testid="dish-delete">{draft.id ? '删除菜品' : '清空草稿'}</Button>
          </Space>
        } bordered>
        {isLoading ? <p className="muted">正在加载菜品...</p> : null}

        <div className="detail-grid">
          <div><span className="detail-label">食材成本</span><strong>¥{draft.ingredientCost.toFixed(2)}</strong></div>
          <div><span className="detail-label">食材行数</span><strong>{resolvedIngredientCount}</strong></div>
        </div>

        <div className="grid-form">
          <label><span className="detail-label">名称</span>
            <Input value={draft.name} onChange={(v) => setDraft((c) => ({ ...c, name: v as string }))} />
          </label>
          <label><span className="detail-label">分类</span>
            <Select value={draft.category} onChange={(v) => setDraft((c) => ({ ...c, category: v as string }))} options={CATEGORY_OPTIONS} clearable={false} />
          </label>
          <label><span className="detail-label">工位</span>
            <Select value={draft.station} onChange={(v) => setDraft((c) => ({ ...c, station: v as string }))} options={stationOptions} clearable={false} />
          </label>
          <label><span className="detail-label">状态</span>
            <Select value={draft.status} onChange={(v) => setDraft((c) => ({ ...c, status: v === 'active' ? 'active' : 'draft' }))} options={[{ value: 'draft', label: '草稿' }, { value: 'active', label: '启用' }]} clearable={false} />
          </label>
          <label><span className="detail-label">餐段</span>
            <Select value={draft.mealType || 'lunch'} onChange={(v) => setDraft((c) => ({ ...c, mealType: v as 'breakfast' | 'lunch' }))} options={[...MEAL_TYPE_OPTIONS]} clearable={false} />
          </label>
          <label><span className="detail-label">推荐权重</span>
            <Select value={draft.recommendWeight || 1} onChange={(v) => setDraft((c) => ({ ...c, recommendWeight: Number(v) as 1 | 2 | 3 }))} options={[...RECOMMEND_WEIGHT_OPTIONS]} clearable={false} />
          </label>
          <label><span className="detail-label">菜品分类标签</span>
            <Select value={draft.dishTypeTag || ''} onChange={(v) => setDraft((c) => ({ ...c, dishTypeTag: v as '' | DishTypeTagValue }))} options={DISH_TYPE_TAG_OPTIONS} clearable={false} />
          </label>
          <label><span className="detail-label">食材成本</span>
            <InputNumber value={draft.ingredientCost} onChange={(v) => setDraft((c) => ({ ...c, ingredientCost: Number(v) }))} min={0} />
          </label>
          <label className="grid-span-2"><span className="detail-label">关联食材</span>
            <Input value={draft.relatedIngredients || ''} onChange={(v) => setDraft((c) => ({ ...c, relatedIngredients: v as string }))} placeholder="逗号分隔的食材名称" />
          </label>
          <label className="grid-span-2"><span className="detail-label">描述</span>
            <Textarea value={draft.description} onChange={(v) => setDraft((c) => ({ ...c, description: v as string }))} />
          </label>
          <label className="grid-span-2"><span className="detail-label">封面图片 URL</span>
            <Input value={draft.coverImageUrl} onChange={(v) => setDraft((c) => ({ ...c, coverImageUrl: v as string }))} />
          </label>
        </div>
      </Card>

      <Card title="食材配方" subtitle="配置食材用量比例和损耗假设。"
        actions={<Button variant="outline" onClick={() => setDraft((c) => ({ ...c, ingredients: [...c.ingredients, { ...EMPTY_INGREDIENT }] }))} data-testid="dish-add-ingredient">添加食材</Button>} bordered>
        <div className="stack-list">
          {draft.ingredients.map((item, index) => {
            const currentIngredient = ingredients.find((c) => c.id === item.ingredientId);
            return (
              <div key={`${item.ingredientId || 'new'}-${index}`} className="nested-card">
                <div className="inline-grid inline-grid-4">
                  <label><span className="detail-label">食材</span>
                    <Select value={item.ingredientId} onChange={(v) => { const selected = ingredients.find((c) => c.id === v as string); updateIngredient(index, { ingredientId: v as string, unit: selected?.unit || item.unit }); }} options={ingredients.map((c) => ({ value: c.id, label: c.name }))} placeholder="选择食材" />
                  </label>
                  <label><span className="detail-label">用量</span>
                    <InputNumber value={item.quantity} onChange={(v) => updateIngredient(index, { quantity: Number(v) })} min={0} />
                  </label>
                  <label><span className="detail-label">单位</span>
                    <Input value={item.unit} onChange={(v) => updateIngredient(index, { unit: v as string })} />
                  </label>
                  <label><span className="detail-label">损耗率</span>
                    <InputNumber value={item.wasteRate} onChange={(v) => updateIngredient(index, { wasteRate: Number(v) })} min={0} decimalPlaces={2} />
                  </label>
                </div>
                <div className="row-split">
                  <span className="muted">{currentIngredient ? `${currentIngredient.name} \u2022 ${currentIngredient.cost.toFixed(2)} / ${currentIngredient.unit}` : '从库存中选择已知食材'}</span>
                  <Button size="small" theme="danger" variant="outline" onClick={() => setDraft((c) => ({ ...c, ingredients: c.ingredients.length === 1 ? [{ ...EMPTY_INGREDIENT }] : c.ingredients.filter((_, i) => i !== index) }))}>移除</Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="SOP 流程" subtitle="定义执行顺序、工位归属和时长。"
        actions={<Button variant="outline" onClick={() => setDraft((c) => ({ ...c, steps: [...c.steps, { ...EMPTY_STEP, id: c.steps.length + 1, station: c.station }] }))} data-testid="dish-add-step">添加步骤</Button>} bordered>
        <div className="stack-list">
          {draft.steps.map((step, index) => (
            <div key={`${step.id}-${index}`} className="nested-card">
              <div className="row-split">
                <strong>步骤 {index + 1}</strong>
                <Button size="small" theme="danger" variant="outline" onClick={() => setDraft((c) => ({ ...c, steps: c.steps.length === 1 ? [{ ...EMPTY_STEP, station: c.station }] : c.steps.filter((_, i) => i !== index) }))}>移除</Button>
              </div>
              <div className="inline-grid inline-grid-3">
                <label><span className="detail-label">标题</span>
                  <Input value={step.title} onChange={(v) => updateStep(index, { title: v as string })} />
                </label>
                <label><span className="detail-label">工位</span>
                  <Select value={step.station} onChange={(v) => updateStep(index, { station: v as string })} options={stationOptions} clearable={false} />
                </label>
                <label><span className="detail-label">时长（分钟）</span>
                  <InputNumber value={step.duration} onChange={(v) => updateStep(index, { duration: Number(v) })} min={0} />
                </label>
              </div>
              <label><span className="detail-label">描述</span>
                <Textarea value={step.description} onChange={(v) => updateStep(index, { description: v as string })} />
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card title="菜品列表" subtitle="已有菜品记录" actions={<Tag theme="default">{filteredItems.length} 条</Tag>} bordered>
        <Table
          resizable
          data={filteredItems}
          columns={[
            { colKey: 'name', title: '名称' },
            { colKey: 'category', title: '分类', cell: ({ row }) => CATEGORY_OPTIONS.find((c) => c.value === (row as DishRecord).category)?.label || (row as DishRecord).category },
            { colKey: 'station', title: '工位' },
            { colKey: 'ingredientCost', title: '食材成本', cell: ({ row }) => `¥${(row as DishRecord).ingredientCost.toFixed(2)}` },
            { colKey: 'status', title: '状态' },
            { colKey: 'mealType', title: '餐段', cell: ({ row }) => (row as DishRecord).mealType === 'breakfast' ? '早餐' : '午餐' },
            { colKey: 'recommendWeight', title: '权重', cell: ({ row }) => RECOMMEND_WEIGHT_OPTIONS.find((w) => w.value === ((row as DishRecord).recommendWeight || 1))?.label || '普通' },
            { colKey: 'dishTypeTag', title: '标签', cell: ({ row }) => getDishTypeTagLabel((row as DishRecord).dishTypeTag) },
          ]}
          rowKey="id"
          rowClassName={({ row }) => (row as DishRecord).id === draft.id ? 'is-selected-row' : ''}
          onRowClick={({ row }) => handleSelectDish(row as DishRecord)}
          size="small"
          hover
          stripe
        />
      </Card>
    </div>
  );
}
