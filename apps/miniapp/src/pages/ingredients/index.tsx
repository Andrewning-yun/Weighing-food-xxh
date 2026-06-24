import { ScrollView, Text, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { fetchDishes, type DishSummary } from '../../api/dish';
import { fetchLatestInventory, type InventoryItem } from '../../api/inventory';
import request from '../../api/request';
import { getSessionUser, hasSession } from '../../utils/session';
import './index.scss';

interface IngredientRecord {
  id: string;
  name: string;
  unit: string;
  price: number;
  costPerUnit?: number;
  supplier?: string;
  spec?: string;
  isActive?: boolean;
  category?: string;
  perishable?: boolean;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface IngredientCatalogRow extends IngredientRecord {
  stockQuantity: number;
  stockState: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  usageCount: number;
  usageDishes: string[];
}

const TYPE_LABELS: Record<string, string> = {
  vegetable: '蔬菜',
  meat: '肉类',
  poultry: '禽类',
  seafood: '海鲜',
  dairy: '乳制品',
  seasoning: '调味料',
  staple: '主食',
  noodle: '面食',
  oil: '食用油',
  fruit: '水果',
  mushroom: '菌菇',
  frozen: '冷冻',
  dry_goods: '干货',
  other: '其他',
};

const CATEGORY_LABELS: Record<string, string> = {
  vegetable: '蔬菜类',
  meat: '肉类',
  poultry: '禽类',
  mushroom: '菌菇类',
  seafood: '海鲜类',
  soy_product: '豆制品',
  egg: '蛋类',
  staple: '主食类',
  seasoning: '调味类',
  oil: '油脂类',
  noodle: '面点类',
  dry_goods: '干货类',
  fruit: '水果类',
  dairy: '乳制品',
  pickled: '腌制类',
  frozen: '冷冻类',
  other: '其他',
};

const STOCK_LABELS: Record<IngredientCatalogRow['stockState'], string> = {
  in_stock: '库存充足',
  low_stock: '库存偏低',
  out_of_stock: '缺货',
  unknown: '未填报',
};

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function formatDateTime(value?: string) {
  if (!value) return '未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatPrice(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return value.toFixed(2);
}

function getCategoryLabel(category?: string) {
  if (!category) return '未分类';
  return CATEGORY_LABELS[category] || category;
}

function getTypeLabel(type?: string) {
  if (!type) return '未设置';
  return TYPE_LABELS[type] || type;
}

function inferStockState(quantity: number): IngredientCatalogRow['stockState'] {
  if (quantity > 10) return 'in_stock';
  if (quantity > 0) return 'low_stock';
  if (quantity === 0) return 'out_of_stock';
  return 'unknown';
}

export default function IngredientsPage() {
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRecord[]>([]);
  const [dishes, setDishes] = useState<DishSummary[]>([]);
  const [latestInventory, setLatestInventory] = useState<InventoryItem | null>(null);

  const user = getSessionUser();
  const storeId = user?.storeId || '';

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    void loadData();
  }, []);

  async function loadData() {
    setBusy(true);
    setMessage('');

    try {
      const [ingredientData, dishData] = await Promise.all([
        request<IngredientRecord[]>({ url: '/ingredients', auth: true }),
        fetchDishes().catch(() => [] as DishSummary[]),
      ]);

      setIngredients(ingredientData || []);
      setDishes(dishData || []);

      if (storeId) {
        const inventory = await fetchLatestInventory(storeId).catch(() => null);
        setLatestInventory(inventory);
      } else {
        setLatestInventory(null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '食材库加载失败。');
    } finally {
      setBusy(false);
    }
  }

  const inventoryMap = useMemo(() => {
    const map = new Map<string, { quantity: number }>();
    latestInventory?.ingredients?.forEach((row) => {
      map.set(row.ingredientId, { quantity: row.quantity });
    });
    return map;
  }, [latestInventory]);

  const dishUsageMap = useMemo(() => {
    const map = new Map<string, { count: number; dishes: string[] }>();
    dishes.forEach((dish) => {
      (dish.ingredients || []).forEach((item) => {
        const current = map.get(item.ingredientId) || { count: 0, dishes: [] };
        current.count += 1;
        if (!current.dishes.includes(dish.name)) {
          current.dishes.push(dish.name);
        }
        map.set(item.ingredientId, current);
      });
    });
    return map;
  }, [dishes]);

  const catalog = useMemo<IngredientCatalogRow[]>(() => {
    return ingredients
      .map((ingredient) => {
        const inventoryRow = inventoryMap.get(ingredient.id);
        const usage = dishUsageMap.get(ingredient.id);
        const stockQuantity = inventoryRow?.quantity ?? 0;

        return {
          ...ingredient,
          stockQuantity,
          stockState: inventoryRow ? inferStockState(stockQuantity) : 'unknown',
          usageCount: usage?.count || 0,
          usageDishes: usage?.dishes || [],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
  }, [dishUsageMap, ingredients, inventoryMap]);

  const categories = useMemo(() => {
    const values = Array.from(new Set(catalog.map((item) => item.category || 'other')));
    return ['all', ...values];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const normalizedKeyword = normalize(keyword);

    return catalog.filter((item) => {
      const categoryMatches = selectedCategory === 'all' || (item.category || 'other') === selectedCategory;
      if (!categoryMatches) return false;
      if (!normalizedKeyword) return true;

      const haystack = [
        item.name,
        item.category || '',
        item.type || '',
        item.unit,
        item.supplier || '',
        item.spec || '',
        getCategoryLabel(item.category),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedKeyword);
    });
  }, [catalog, keyword, selectedCategory]);

  const activeIngredient = useMemo(() => {
    if (!filteredCatalog.length) return null;
    return filteredCatalog.find((item) => item.id === selectedIngredientId) || filteredCatalog[0];
  }, [filteredCatalog, selectedIngredientId]);

  const totalActive = catalog.filter((item) => item.isActive !== false).length;
  const totalInStock = catalog.filter((item) => item.stockState === 'in_stock' || item.stockState === 'low_stock').length;
  const totalPerishable = catalog.filter((item) => item.perishable).length;

  return (
    <View className='screen ingredients-screen'>
      <View className='ig-hero shell-card'>
        <View className='ig-hero-copy'>
          <Text className='eyebrow'>食材工作台</Text>
          <Text className='ig-title'>食材库</Text>
          <Text className='ig-subtitle'>只读查看 | {user?.storeName || user?.storeId || '当前门店'}</Text>
        </View>
        <View className='ig-hero-badges'>
          <Text className='ig-pill'>总数 {catalog.length}</Text>
          <Text className='ig-pill'>启用 {totalActive}</Text>
          <Text className='ig-pill'>有库存 {totalInStock}</Text>
          <Text className='ig-pill'>易腐食材 {totalPerishable}</Text>
        </View>
      </View>

      <View className='shell-card ig-toolbar'>
        <NutInput
          className='ig-search'
          placeholder='搜索名称、分类、规格、供应商'
          value={keyword}
          onChange={(v) => setKeyword(v)}
        />
        <View className='ig-toolbar-actions'>
          <NutButton size='mini' onClick={() => void loadData()} loading={busy}>
            刷新
          </NutButton>
          <NutButton size='mini' onClick={() => setKeyword('')}>
            清空搜索
          </NutButton>
        </View>
      </View>

      <ScrollView scrollX className='ig-category-scroll'>
        <View className='ig-category-row'>
          <View
            className={`ig-category-chip ${selectedCategory === 'all' ? 'ig-category-chip-active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <Text>全部</Text>
          </View>
          {categories
            .filter((category) => category !== 'all')
            .map((category) => (
              <View
                key={category}
                className={`ig-category-chip ${selectedCategory === category ? 'ig-category-chip-active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                <Text>{getCategoryLabel(category)}</Text>
              </View>
            ))}
        </View>
      </ScrollView>

      {message ? <Text className='ig-message'>{message}</Text> : null}

      {busy ? (
        <View className='ig-loading shell-card'>
          <Text className='ig-loading-text'>正在加载食材库...</Text>
        </View>
      ) : null}

      {!busy && filteredCatalog.length === 0 ? (
        <View className='shell-card ig-empty'>
          <Text className='ig-empty-title'>没有找到匹配食材</Text>
          <Text className='ig-empty-text'>请调整筛选条件，或刷新后重试。</Text>
        </View>
      ) : null}

      {!busy && filteredCatalog.length > 0 ? (
        <View className='ig-list'>
          {filteredCatalog.map((item) => {
            const selected = activeIngredient?.id === item.id;
            return (
              <View
                key={item.id}
                className={`shell-card ig-card ${selected ? 'ig-card-active' : ''}`}
                onClick={() => setSelectedIngredientId(item.id)}
              >
                <View className='ig-card-top'>
                  <View className='ig-card-title-group'>
                    <Text className='ig-card-title'>{item.name}</Text>
                    <Text className='ig-card-subtitle'>
                      {getCategoryLabel(item.category)} | {item.unit}
                    </Text>
                  </View>
                  <Text className={`ig-status ig-status-${item.stockState}`}>{STOCK_LABELS[item.stockState]}</Text>
                </View>

                <View className='ig-tag-row'>
                  <Text className='ig-tag'>{getTypeLabel(item.type)}</Text>
                  <Text className='ig-tag'>{item.perishable ? '易腐' : '耐储'}</Text>
                  <Text className='ig-tag'>{item.isActive === false ? '停用' : '启用'}</Text>
                </View>

                <View className='ig-metrics'>
                  <View className='ig-metric'>
                    <Text className='ig-metric-label'>单价</Text>
                    <Text className='ig-metric-value'>{formatPrice(item.price)}</Text>
                  </View>
                  <View className='ig-metric'>
                    <Text className='ig-metric-label'>成本单价</Text>
                    <Text className='ig-metric-value'>{formatPrice(item.costPerUnit ?? item.price)}</Text>
                  </View>
                  <View className='ig-metric'>
                    <Text className='ig-metric-label'>最新库存</Text>
                    <Text className='ig-metric-value'>
                      {item.stockQuantity.toFixed(1)} {item.unit}
                    </Text>
                  </View>
                  <View className='ig-metric'>
                    <Text className='ig-metric-label'>关联菜品</Text>
                    <Text className='ig-metric-value'>{item.usageCount}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {activeIngredient ? (
        <View className='shell-card ig-detail'>
          <View className='ig-detail-head'>
            <View>
              <Text className='ig-detail-title'>{activeIngredient.name}</Text>
              <Text className='ig-detail-subtitle'>
                {getCategoryLabel(activeIngredient.category)} | {activeIngredient.unit}
              </Text>
            </View>
            <Text className={`ig-status ig-status-${activeIngredient.stockState}`}>
              {STOCK_LABELS[activeIngredient.stockState]}
            </Text>
          </View>

          <View className='ig-detail-grid'>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>规格</Text>
              <Text className='ig-detail-value'>{activeIngredient.spec || '未填写'}</Text>
            </View>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>供应商</Text>
              <Text className='ig-detail-value'>{activeIngredient.supplier || '未填写'}</Text>
            </View>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>是否易腐</Text>
              <Text className='ig-detail-value'>{activeIngredient.perishable ? '是' : '否'}</Text>
            </View>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>食材类型</Text>
              <Text className='ig-detail-value'>{getTypeLabel(activeIngredient.type)}</Text>
            </View>
          </View>

          <View className='ig-detail-grid'>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>库存数量</Text>
              <Text className='ig-detail-value'>
                {activeIngredient.stockQuantity.toFixed(1)} {activeIngredient.unit}
              </Text>
            </View>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>使用次数</Text>
              <Text className='ig-detail-value'>{activeIngredient.usageCount}</Text>
            </View>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>单价</Text>
              <Text className='ig-detail-value'>{formatPrice(activeIngredient.price)}</Text>
            </View>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>成本单价</Text>
              <Text className='ig-detail-value'>{formatPrice(activeIngredient.costPerUnit ?? activeIngredient.price)}</Text>
            </View>
          </View>

          <View className='ig-detail-list'>
            <Text className='ig-detail-list-title'>关联菜品</Text>
            {activeIngredient.usageDishes.length > 0 ? (
              activeIngredient.usageDishes.slice(0, 4).map((dishName) => (
                <Text key={dishName} className='ig-detail-list-item'>
                  {dishName}
                </Text>
              ))
            ) : (
              <Text className='ig-detail-list-item ig-detail-muted'>当前还没有菜品引用该食材。</Text>
            )}
          </View>

          <View className='ig-detail-grid ig-detail-grid-compact'>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>最近更新</Text>
              <Text className='ig-detail-value'>
                {formatDateTime(activeIngredient.updatedAt || activeIngredient.createdAt)}
              </Text>
            </View>
            <View className='ig-detail-item'>
              <Text className='ig-detail-label'>库存门店</Text>
              <Text className='ig-detail-value'>{storeId || '未绑定门店'}</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
