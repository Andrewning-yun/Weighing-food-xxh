import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import InputNumber from 'tdesign-react/es/input-number';
import Select from 'tdesign-react/es/select';
import Table from 'tdesign-react/es/table';
import Tag from 'tdesign-react/es/tag';
import Space from 'tdesign-react/es/space';
import { fetchDishes, fetchStores, type DishRecord } from '../lib/api';
import { toast } from '../lib/toast';
import { formatDateTime } from '../lib/format';
import {
  Station,
  WEB_ADMIN_DEFAULT_API_BASE_URL,
  WEB_ADMIN_TOKEN_KEY,
} from '../../../../packages/config/index';

type MealType = 'breakfast' | 'lunch';
type MenuPlanStatus = 'draft' | 'published' | 'archived';

interface MenuPlanDishItem {
  dishId: string;
  dishName: string;
  category: string;
  mealType: MealType;
  recommendWeight: 1 | 2 | 3;
  overrideQty: number;
  isActive: boolean;
}

interface MenuPlanRecord {
  id: string;
  date: string;
  storeId: string;
  storeName?: string;
  mealType: MealType;
  dishes: Array<{
    dishId: string;
    overrideQty?: number;
    isActive?: boolean;
    dishName?: string;
    category?: string;
    mealType?: MealType;
    recommendWeight?: 1 | 2 | 3;
  }>;
  status: MenuPlanStatus;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MenuPlanDraft {
  id?: string;
  date: string;
  storeId: string;
  mealType: MealType;
  status: MenuPlanStatus;
  dishes: MenuPlanDishItem[];
}

interface MenuPlanPayload {
  storeId: string;
  date: string;
  mealType: MealType;
  dishes: Array<{
    dishId: string;
    overrideQty: number;
    isActive: boolean;
  }>;
}

interface SupplementaryOrderRecord {
  id: string;
  storeId: string;
  date: string;
  mealType: MealType;
  menuPlanId: string;
  dishId: string;
  dishName: string;
  station: string;
  userId: string;
  userName: string;
  reason: string | null;
  estimatedQuantity: number | null;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = WEB_ADMIN_DEFAULT_API_BASE_URL;

const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '正餐' },
];

const STATION_FILTER_OPTIONS = [
  { value: '', label: '全部工位' },
  { value: Station.WOK, label: '炒锅' },
  { value: Station.GRILL_FRY_STEAM, label: '煎扒蒸菜' },
  { value: Station.PREP, label: '切配' },
  { value: Station.BREAKFAST_WOK, label: '早餐炒锅' },
  { value: Station.BREAKFAST_ASSIST, label: '早餐副手' },
];

const STATUS_LABELS: Record<MenuPlanStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

const CATEGORY_LABELS: Record<string, string> = {
  steam: '蒸菜', panfry: '煎炒', fry: '油炸', casserole: '砂锅',
  stir: '炒菜', fruit: '水果', cold: '凉菜', soup: '汤品',
  tea: '茶饮', porridge: '粥品', pastry: '面点', breakfast_drink: '饮品',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(WEB_ADMIN_TOKEN_KEY) || '';
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${getToken()}`);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Request failed (${response.status})`);
  if (!text.trim()) return undefined as T;
  const parsed = JSON.parse(text) as T | { data?: T };
  if (parsed && typeof parsed === 'object' && 'data' in parsed && (parsed as { data?: T }).data !== undefined) {
    return (parsed as { data: T }).data;
  }
  return parsed as T;
}

function createEmptyDraft(storeId: string, date: string, mealType: MealType): MenuPlanDraft {
  return { storeId, date, mealType, status: 'draft', dishes: [] };
}

function buildDishItem(dish: DishRecord, overrideQty = 1, isActive = true): MenuPlanDishItem {
  return {
    dishId: dish.id,
    dishName: dish.name,
    category: dish.category,
    mealType: (dish.mealType || 'lunch') as MealType,
    recommendWeight: (dish.recommendWeight || 1) as 1 | 2 | 3,
    overrideQty,
    isActive,
  };
}

function buildDraftFromPlan(plan: MenuPlanRecord, catalog: DishRecord[]): MenuPlanDraft {
  return {
    id: plan.id,
    storeId: plan.storeId,
    date: plan.date,
    mealType: plan.mealType,
    status: plan.status,
    dishes: plan.dishes.map((item) => {
      const catalogDish = catalog.find((candidate) => candidate.id === item.dishId);
      return {
        dishId: item.dishId,
        dishName: catalogDish?.name || item.dishName || item.dishId,
        category: catalogDish?.category || item.category || '未分类',
        mealType: (catalogDish?.mealType || item.mealType || plan.mealType) as MealType,
        recommendWeight: (catalogDish?.recommendWeight || item.recommendWeight || 1) as 1 | 2 | 3,
        overrideQty: Number(item.overrideQty ?? 1),
        isActive: item.isActive ?? true,
      };
    }),
  };
}

function formatWeight(weight?: 1 | 2 | 3) {
  switch (weight) {
    case 1: return '普通';
    case 2: return '推荐';
    case 3: return '强推';
    default: return '普通';
  }
}

function formatCategory(category: string) {
  return CATEGORY_LABELS[category] || category || '未分类';
}

async function fetchMenuPlans(storeId: string, date: string): Promise<MenuPlanRecord[]> {
  return requestJson<MenuPlanRecord[]>(`/menu-plans?${new URLSearchParams({ storeId, date }).toString()}`);
}

async function createMenuPlan(data: MenuPlanPayload): Promise<MenuPlanRecord> {
  return requestJson<MenuPlanRecord>('/menu-plans', {
    method: 'POST',
    body: JSON.stringify({ storeId: data.storeId, date: data.date, mealType: data.mealType,
      dishes: data.dishes.map((item) => ({ dishId: item.dishId, overrideQty: Number(item.overrideQty || 1), isActive: item.isActive })) }),
  });
}

async function updateMenuPlan(id: string, data: MenuPlanPayload): Promise<MenuPlanRecord> {
  return requestJson<MenuPlanRecord>(`/menu-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ storeId: data.storeId, date: data.date, mealType: data.mealType,
      dishes: data.dishes.map((item) => ({ dishId: item.dishId, overrideQty: Number(item.overrideQty || 1), isActive: item.isActive })) }),
  });
}

async function publishMenuPlan(id: string): Promise<MenuPlanRecord> {
  return requestJson<MenuPlanRecord>(`/menu-plans/${id}/publish`, { method: 'POST' });
}

async function fetchSupplementaryOrders(menuPlanId: string): Promise<SupplementaryOrderRecord[]> {
  return requestJson<SupplementaryOrderRecord[]>(`/supplementary-orders?${new URLSearchParams({ menuPlanId }).toString()}`);
}

async function deleteSupplementaryOrder(id: string): Promise<{ id: string }> {
  return requestJson<{ id: string }>(`/supplementary-orders/${id}`, { method: 'DELETE' });
}

export function MenuPlansPage() {
  const { data: stores = [] } = useSWR('menuplan-stores', fetchStores);
  const { data: dishes = [] } = useSWR('menuplan-dishes', fetchDishes);
  const [queryStoreId, setQueryStoreId] = useState('');
  const [queryDate, setQueryDate] = useState(today());
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [draft, setDraft] = useState<MenuPlanDraft>(createEmptyDraft('', today(), 'breakfast'));
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dishQuery, setDishQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [supplementOrders, setSupplementOrders] = useState<SupplementaryOrderRecord[]>([]);
  const [supplementLoading, setSupplementLoading] = useState(false);

  // Set initial store
  if (!queryStoreId && stores.length > 0) {
    setQueryStoreId(stores[0].id);
  }

  const { data: plans = [], isLoading: loadingPlans, mutate } = useSWR(
    queryStoreId ? ['menu-plans', queryStoreId, queryDate] : null,
    () => fetchMenuPlans(queryStoreId, queryDate),
  );

  const activePlan = useMemo(() => plans.find((item) => item.mealType === mealType) || null, [mealType, plans]);

  useEffect(() => {
    if (!queryStoreId) return;
    if (activePlan) {
      setDraft(buildDraftFromPlan(activePlan, dishes));
      setSelectedPlanId(activePlan.id);
    } else {
      setDraft(createEmptyDraft(queryStoreId, queryDate, mealType));
      setSelectedPlanId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlan?.id]);

  const filteredDishes = useMemo(() => {
    const query = dishQuery.trim().toLowerCase();
    return dishes.filter((dish) => {
      const matchesMeal = !dish.mealType || dish.mealType === mealType;
      const matchesStation = !stationFilter || dish.station === stationFilter;
      const matchesQuery = !query || dish.name.toLowerCase().includes(query) || dish.category.toLowerCase().includes(query) || dish.station.toLowerCase().includes(query);
      return matchesMeal && matchesStation && matchesQuery;
    });
  }, [dishQuery, dishes, mealType, stationFilter]);

  const selectedDishCount = draft.dishes.filter((item) => item.isActive).length;

  function updateSelectedDish(index: number, patch: Partial<MenuPlanDishItem>) {
    setDraft((current) => ({
      ...current,
      dishes: current.dishes.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  function resetDraft() {
    if (!queryStoreId) return;
    setDraft(createEmptyDraft(queryStoreId, queryDate, mealType));
    setSelectedPlanId(null);
  }

  function selectPlan(plan: MenuPlanRecord) {
    setMealType(plan.mealType); setDraft(buildDraftFromPlan(plan, dishes)); setSelectedPlanId(plan.id);
  }

  function addDish(dish: DishRecord) {
    setDraft((current) => {
      if (current.dishes.some((item) => item.dishId === dish.id)) return current;
      return { ...current, dishes: [...current.dishes, buildDishItem(dish)] };
    });
  }

  function removeDish(dishId: string) {
    setDraft((current) => ({ ...current, dishes: current.dishes.filter((i) => i.dishId !== dishId) }));
  }

  async function handleSave() {
    if (!draft.storeId) { toast.warning('请选择门店'); return; }
    if (draft.dishes.length === 0) { toast.warning('请至少添加一个菜品'); return; }
    setSaving(true);
    try {
      const payload = {
        storeId: draft.storeId, date: draft.date, mealType: draft.mealType,
        dishes: draft.dishes.map((item) => ({ dishId: item.dishId, overrideQty: Number(item.overrideQty || 1), isActive: item.isActive })),
      };
      const saved = draft.id ? await updateMenuPlan(draft.id, payload) : await createMenuPlan(payload);
      setDraft(buildDraftFromPlan(saved, dishes)); setSelectedPlanId(saved.id); setMealType(saved.mealType);
      toast.success(draft.id ? '菜单计划已更新' : '菜单计划已创建');
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally { setSaving(false); }
  }

  async function handlePublish() {
    if (!draft.id) { toast.warning('请先保存当前菜单计划'); return; }
    await handlePublishPlan(draft.id);
  }

  async function handlePublishPlan(planId: string) {
    setPublishing(true);
    try {
      const published = await publishMenuPlan(planId);
      if (draft.id === planId) { setDraft(buildDraftFromPlan(published, dishes)); setSelectedPlanId(published.id); }
      toast.success('菜单计划已发布');
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发布失败');
    } finally { setPublishing(false); }
  }

  async function loadSupplementOrders(menuPlanId: string) {
    setSupplementLoading(true);
    try {
      const orders = await fetchSupplementaryOrders(menuPlanId);
      setSupplementOrders(orders);
    } catch {
      setSupplementOrders([]);
    } finally {
      setSupplementLoading(false);
    }
  }

  async function handleDeleteSupplementOrder(id: string) {
    try {
      await deleteSupplementaryOrder(id);
      setSupplementOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success('补单已撤销');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '撤销失败');
    }
  }

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));
  const storeSelectValue = queryStoreId || undefined;

  return (
    <div className="page-stack">
      <Card title="菜单计划管理" subtitle="构建早餐和正餐计划，然后发布到门店。"
        actions={
          <Space>
            <Button variant="outline" onClick={resetDraft} disabled={!queryStoreId}>新计划</Button>
            <Button theme="primary" onClick={handleSave} loading={saving} disabled={!queryStoreId}>
              {draft.id ? '更新计划' : '保存计划'}
            </Button>
            <Button theme="success" onClick={handlePublish} loading={publishing} disabled={!draft.id}>发布</Button>
          </Space>
        } bordered>
        {loadingPlans ? <p className="muted">正在加载已有计划...</p> : null}

        <div className="grid-form">
          <label>
            <span className="detail-label">门店</span>
            <Select value={storeSelectValue} onChange={(v) => { setQueryStoreId(v as string); }} options={storeOptions} placeholder="选择门店" clearable={false} />
          </label>
          <label>
            <span className="detail-label">日期</span>
            <input type="date" value={queryDate} onChange={(e) => { setQueryDate(e.target.value); }} style={{ width: '100%', borderRadius: 'var(--td-radius-default, 6px)', border: '1px solid var(--td-component-border)', padding: '5px 8px', height: 32, fontSize: '0.9rem', background: 'var(--td-bg-color-container)' }} />
          </label>
          <label>
            <span className="detail-label">餐段</span>
            <Select value={mealType} onChange={(v) => { setMealType(v as MealType); }} options={MEAL_TYPE_OPTIONS} clearable={false} />
          </label>
          <label>
            <span className="detail-label">当前状态</span>
            <Input value={STATUS_LABELS[draft.status]} readonly />
          </label>
        </div>

        <div className="detail-grid">
          <div><span className="detail-label">门店</span><strong>{stores.find((s) => s.id === queryStoreId)?.name || draft.storeId || '未选择'}</strong></div>
          <div><span className="detail-label">日期</span><strong>{draft.date}</strong></div>
          <div><span className="detail-label">餐段</span><strong>{MEAL_TYPE_OPTIONS.find((i) => i.value === draft.mealType)?.label}</strong></div>
          <div><span className="detail-label">已选菜品</span><strong>{selectedDishCount}</strong></div>
        </div>
      </Card>

      <Card title="菜品目录" subtitle="为当前菜单计划选择菜品。" bordered>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <Input value={dishQuery} onChange={(v) => setDishQuery(v as string)} placeholder="搜索菜品名称、分类或工位" style={{ flex: 1 }} />
          <Select value={stationFilter} onChange={(v) => setStationFilter(v as string)} options={STATION_FILTER_OPTIONS} clearable={false} style={{ width: 140 }} />
        </div>
        <Table
          resizable
          data={filteredDishes}
          columns={[
            { colKey: 'name', title: '名称' },
            { colKey: 'category', title: '分类', cell: ({ row }) => formatCategory((row as DishRecord).category) },
            { colKey: 'mealType', title: '餐段', cell: ({ row }) => (row as DishRecord).mealType === 'breakfast' ? '早餐' : '正餐' },
            { colKey: 'recommendWeight', title: '权重', cell: ({ row }) => formatWeight((row as DishRecord).recommendWeight) },
            { colKey: 'station', title: '工位' },
            { colKey: 'status', title: '状态' },
            { colKey: 'price', title: '售价' },
            {
              colKey: 'action', title: '操作',
              cell: ({ row }) => {
                const dish = row as DishRecord;
                const added = draft.dishes.some((i) => i.dishId === dish.id);
                return <Button size="small" variant="outline" onClick={() => addDish(dish)} disabled={added}>{added ? '已添加' : '添加'}</Button>;
              },
            },
          ]}
          rowKey="id"
          size="small"
          hover
          stripe
        />
      </Card>

      <Card title="已选菜品" subtitle="发布前调整数量和启用状态。" actions={<Tag theme="primary">{draft.dishes.length} 行</Tag>} bordered>
        {draft.dishes.length === 0 ? (
          <p className="muted">尚未选择菜品。</p>
        ) : (
          <div className="stack-list">
            {draft.dishes.map((item, index) => (
              <div key={item.dishId} className="nested-card">
                <div className="row-split">
                  <strong>{item.dishName}</strong>
                  <Button size="small" theme="danger" variant="outline" onClick={() => removeDish(item.dishId)}>移除</Button>
                </div>
                <div className="inline-grid inline-grid-4">
                  <label><span className="detail-label">菜品ID</span><Input value={item.dishId} readonly /></label>
                  <label><span className="detail-label">分类</span><Input value={formatCategory(item.category)} readonly /></label>
                  <label><span className="detail-label">数量</span>
                    <InputNumber min={1} value={item.overrideQty} onChange={(v) => updateSelectedDish(index, { overrideQty: Number(v) || 1 })} />
                  </label>
                  <label><span className="detail-label">启用</span>
                    <Select value={item.isActive ? 'yes' : 'no'} onChange={(v) => updateSelectedDish(index, { isActive: v === 'yes' })} options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]} clearable={false} />
                  </label>
                </div>
                <div className="detail-grid">
                  <div><span className="detail-label">餐段</span><strong>{item.mealType === 'breakfast' ? '早餐' : '正餐'}</strong></div>
                  <div><span className="detail-label">推荐权重</span><strong>{formatWeight(item.recommendWeight)}</strong></div>
                  <div className="grid-span-2">
                    <span className="detail-label">说明</span>
                    <p className="muted">后端按菜品ID存储菜单计划条目，页面保留本地菜品快照供编辑和预览。</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="已有计划" subtitle="查看所选门店和日期的所有菜单计划。" actions={<Tag theme="default">{plans.length} 条</Tag>} bordered>
        <Table
          resizable
          data={plans}
          columns={[
            { colKey: 'mealType', title: '餐段', cell: ({ row }) => (row as MenuPlanRecord).mealType === 'breakfast' ? '早餐' : '正餐' },
            { colKey: 'status', title: '状态', cell: ({ row }) => STATUS_LABELS[(row as MenuPlanRecord).status] },
            { colKey: 'dishes', title: '菜品数', cell: ({ row }) => (row as MenuPlanRecord).dishes.length },
            { colKey: 'createdByName', title: '创建人', cell: ({ row }) => (row as MenuPlanRecord).createdByName || '-' },
            { colKey: 'updatedAt', title: '更新时间', cell: ({ row }) => formatDateTime((row as MenuPlanRecord).updatedAt || (row as MenuPlanRecord).createdAt) },
            {
              colKey: 'action', title: '操作',
              cell: ({ row }) => {
                const plan = row as MenuPlanRecord;
                return (
                  <Space>
                    <Button size="small" variant="outline" onClick={() => selectPlan(plan)}>编辑</Button>
                    <Button size="small" theme="success" variant="outline" onClick={() => void handlePublishPlan(plan.id)} loading={publishing}>发布</Button>
                    <Button size="small" variant="outline" onClick={() => { void loadSupplementOrders(plan.id); }}>补单</Button>
                  </Space>
                );
              },
            },
          ]}
          rowKey="id"
          rowClassName={({ row }) => (row as MenuPlanRecord).id === selectedPlanId ? 'is-selected-row' : ''}
          size="small"
          hover
          stripe
        />
      </Card>

      {supplementOrders.length > 0 || supplementLoading ? (
        <Card title="补单记录" subtitle="查看选中菜单计划的补单记录。" actions={<Tag theme="default">{supplementOrders.length} 条</Tag>} bordered>
          {supplementLoading ? (
            <p className="muted">正在加载补单记录...</p>
          ) : (
            <Table
              resizable
              data={supplementOrders}
              columns={[
                { colKey: 'dishName', title: '菜品' },
                { colKey: 'station', title: '工位' },
                { colKey: 'userName', title: '操作人' },
                { colKey: 'estimatedQuantity', title: '预估份数', cell: ({ row }) => (row as SupplementaryOrderRecord).estimatedQuantity ?? '-' },
                { colKey: 'reason', title: '原因', cell: ({ row }) => (row as SupplementaryOrderRecord).reason || '-' },
                { colKey: 'createdAt', title: '时间', cell: ({ row }) => formatDateTime((row as SupplementaryOrderRecord).createdAt) },
                {
                  colKey: 'action', title: '操作',
                  cell: ({ row }) => {
                    const order = row as SupplementaryOrderRecord;
                    return (
                      <Button size="small" theme="danger" variant="outline" onClick={() => { void handleDeleteSupplementOrder(order.id); }}>
                        撤销
                      </Button>
                    );
                  },
                },
              ]}
              rowKey="id"
              size="small"
              hover
              stripe
            />
          )}
        </Card>
      ) : null}
    </div>
  );
}
