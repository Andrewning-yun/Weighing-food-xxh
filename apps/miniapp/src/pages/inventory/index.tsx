import { ScrollView, Text, View } from '@tarojs/components';
import { Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import {
  createInventory,
  fetchInventories,
  fetchLatestInventory,
  updateInventory,
  type InventoryItem,
} from '../../api/inventory';
import { formatRoleLabel, getSessionUser, hasSession } from '../../utils/session';
import './index.scss';

type Role =
  | 'admin'
  | 'chef_manager'
  | 'chef'
  | 'prep'
  | 'breakfast_chef'
  | 'breakfast_assistant'
  | 'buyer'
  | 'store_manager';

interface IngredientEntry {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

const INGREDIENT_CATEGORIES = ['蔬菜', '肉类', '禽类', '水产', '调料', '主食', '其他'];

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildRecentDates(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return toDateStr(date);
  });
}

function guessCategory(name: string): string {
  if (/土豆|白菜|黄瓜|番茄|青椒|洋葱|蔬菜/.test(name)) return '蔬菜';
  if (/猪|牛|羊|肉|排骨/.test(name)) return '肉类';
  if (/鸡|鸭|鹅|蛋/.test(name)) return '禽类';
  if (/鱼|虾|蟹|海鲜/.test(name)) return '水产';
  if (/油|盐|酱|醋|料酒|调料/.test(name)) return '调料';
  if (/米|面|粉|馒头|粥/.test(name)) return '主食';
  return '其他';
}

function buildDefaultEntries(): IngredientEntry[] {
  return [
    { ingredientId: 'def_1', name: '土豆', quantity: 0, unit: 'kg', category: '蔬菜' },
    { ingredientId: 'def_2', name: '白菜', quantity: 0, unit: 'kg', category: '蔬菜' },
    { ingredientId: 'def_3', name: '番茄', quantity: 0, unit: 'kg', category: '蔬菜' },
    { ingredientId: 'def_4', name: '青椒', quantity: 0, unit: 'kg', category: '蔬菜' },
    { ingredientId: 'def_5', name: '洋葱', quantity: 0, unit: 'kg', category: '蔬菜' },
    { ingredientId: 'def_6', name: '猪肉', quantity: 0, unit: 'kg', category: '肉类' },
    { ingredientId: 'def_7', name: '牛肉', quantity: 0, unit: 'kg', category: '肉类' },
    { ingredientId: 'def_8', name: '排骨', quantity: 0, unit: 'kg', category: '肉类' },
    { ingredientId: 'def_9', name: '鸡肉', quantity: 0, unit: 'kg', category: '禽类' },
    { ingredientId: 'def_10', name: '鸡蛋', quantity: 0, unit: '个', category: '禽类' },
    { ingredientId: 'def_11', name: '鱼', quantity: 0, unit: 'kg', category: '水产' },
    { ingredientId: 'def_12', name: '食用油', quantity: 0, unit: 'L', category: '调料' },
    { ingredientId: 'def_13', name: '盐', quantity: 0, unit: 'kg', category: '调料' },
    { ingredientId: 'def_14', name: '酱油', quantity: 0, unit: 'L', category: '调料' },
    { ingredientId: 'def_15', name: '大米', quantity: 0, unit: 'kg', category: '主食' },
    { ingredientId: 'def_16', name: '面粉', quantity: 0, unit: 'kg', category: '主食' },
  ];
}

function normalizeInventoryEntries(inventory: InventoryItem | null): IngredientEntry[] {
  return (inventory?.ingredients || []).map((item) => ({
    ingredientId: item.ingredientId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: guessCategory(item.name),
  }));
}

function formatDateTime(value?: string): string {
  return value ? value.replace('T', ' ').slice(0, 16) : '-';
}

export default function InventoryPage() {
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [existingInventory, setExistingInventory] = useState<InventoryItem | null>(null);
  const [ingredientEntries, setIngredientEntries] = useState<IngredientEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const recentDates = useMemo(() => buildRecentDates(), []);

  const user = getSessionUser();
  const role = (user?.role || '') as Role;
  const storeId = user?.storeId || '';
  const canSubmit = role === 'admin' || role === 'prep' || role === 'chef_manager';

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }
    void loadData();
  }, []);

  useEffect(() => {
    if (storeId) {
      void loadForDate();
    }
  }, [selectedDate]);

  async function loadData() {
    setBusy(true);
    setMessage('');
    try {
      await loadForDate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '库存数据加载失败。');
    } finally {
      setBusy(false);
    }
  }

  async function loadForDate() {
    setSubmitSuccess(false);
    try {
      const inventories = await fetchInventories({ storeId, date: selectedDate });
      const current = inventories?.[0] || null;
      if (current) {
        setExistingInventory(current);
        setIngredientEntries(normalizeInventoryEntries(current));
        return;
      }

      setExistingInventory(null);
      try {
        const latest = await fetchLatestInventory(storeId);
        const templateEntries = normalizeInventoryEntries(latest).map((item) => ({
          ...item,
          quantity: 0,
        }));
        setIngredientEntries(templateEntries.length > 0 ? templateEntries : buildDefaultEntries());
      } catch {
        setIngredientEntries(buildDefaultEntries());
      }
    } catch {
      setExistingInventory(null);
      setIngredientEntries(buildDefaultEntries());
    }
  }

  function handleQuantityChange(ingredientId: string, value: string) {
    const quantity = Number.parseFloat(value) || 0;
    setIngredientEntries((current) =>
      current.map((item) => (item.ingredientId === ingredientId ? { ...item, quantity } : item)),
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setMessage('');
    setSubmitSuccess(false);

    try {
      const ingredients = ingredientEntries
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          ingredientId: item.ingredientId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        }));

      if (ingredients.length === 0) {
        setMessage('请至少填写一项库存数量。');
        return;
      }

      const payload: Partial<InventoryItem> = {
        storeId,
        date: selectedDate,
        ingredients,
      };

      if (existingInventory) {
        await updateInventory(existingInventory.id, payload);
      } else {
        await createInventory(payload);
      }

      setSubmitSuccess(true);
      setMessage(existingInventory ? '库存已更新。' : '库存已创建。');
      await loadForDate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '库存提交失败。');
    } finally {
      setSubmitting(false);
    }
  }

  const groupedEntries = useMemo(() => {
    const grouped = new Map<string, IngredientEntry[]>();
    ingredientEntries.forEach((item) => {
      const current = grouped.get(item.category) || [];
      current.push(item);
      grouped.set(item.category, current);
    });

    return INGREDIENT_CATEGORIES.filter((category) => grouped.has(category)).map((category) => ({
      category,
      items: grouped.get(category) || [],
    }));
  }, [ingredientEntries]);

  const totalFilled = ingredientEntries.filter((item) => item.quantity > 0).length;

  return (
    <View className='screen inventory-screen'>
      <View className='inv-header'>
        <Text className='inv-title'>库存填报</Text>
        <Text className='inv-store'>{user?.storeName || user?.storeId || '未分配门店'}</Text>
      </View>

      <View className='inv-summary'>
        <Text className='inv-summary-text'>当前角色：{formatRoleLabel(role)}</Text>
        <Text className='inv-summary-text'>已填写 {totalFilled} / {ingredientEntries.length} 项</Text>
        <Text className='inv-summary-text'>{existingInventory ? '当前为编辑模式' : '当前为新建模式'}</Text>
        {existingInventory?.createdAt ? (
          <Text className='inv-summary-text'>已有记录时间：{formatDateTime(existingInventory.createdAt)}</Text>
        ) : null}
        {existingInventory?.updatedAt ? (
          <Text className='inv-summary-text'>最近更新时间：{formatDateTime(existingInventory.updatedAt)}</Text>
        ) : null}
      </View>

      <ScrollView scrollX className='inv-date-scroll'>
        {recentDates.map((dateStr) => (
          <View
            key={dateStr}
            className={`inv-date-item ${selectedDate === dateStr ? 'inv-date-active' : ''}`}
            onClick={() => setSelectedDate(dateStr)}
          >
            <Text className='inv-date-text'>{dateStr.slice(5)}</Text>
            {dateStr === toDateStr(new Date()) ? <Text className='inv-date-today'>今天</Text> : null}
          </View>
        ))}
      </ScrollView>

      {submitSuccess ? (
        <View className='inv-success'>
          <Text className='inv-success-text'>提交成功</Text>
        </View>
      ) : null}

      {message ? <Text className='inv-message'>{message}</Text> : null}

      {busy ? (
        <View className='inv-loading'>
          <Text className='inv-loading-text'>正在加载库存数据...</Text>
        </View>
      ) : null}

      {!busy ? (
        <ScrollView scrollY className='inv-content'>
          {groupedEntries.map((group) => (
            <View key={group.category} className='inv-group'>
              <Text className='inv-group-title'>{group.category}</Text>
              <View className='inv-group-list'>
                {group.items.map((item) => (
                  <View key={item.ingredientId} className='inv-item'>
                    <View className='inv-item-left'>
                      <Text className='inv-item-name'>{item.name}</Text>
                      <Text className='inv-item-unit'>{item.unit}</Text>
                    </View>
                    <View className='inv-item-right'>
                      <NutInput
                        className='inv-item-input'
                        type='digit'
                        value={item.quantity > 0 ? String(item.quantity) : ''}
                        placeholder='0'
                        onChange={(v) => handleQuantityChange(item.ingredientId, v)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {!busy && canSubmit ? (
        <View className='inv-submit-area'>
          <View
            className={`inv-submit-btn ${submitting ? 'inv-submit-disabled' : ''}`}
            onClick={() => (submitting ? null : handleSubmit())}
          >
            <Text className='inv-submit-text'>{submitting ? '提交中...' : existingInventory ? '更新库存' : '提交库存'}</Text>
          </View>
        </View>
      ) : null}

      <View className='inv-tab-bar'>
        <View className='inv-bar-item' onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}>
          <Text className='inv-bar-label'>首页</Text>
        </View>
        <View className='inv-bar-item' onClick={() => Taro.navigateTo({ url: '/pages/menu-plan/index' })}>
          <Text className='inv-bar-label'>菜单</Text>
        </View>
        <View className='inv-bar-item inv-bar-active'>
          <Text className='inv-bar-label'>库存</Text>
        </View>
        <View className='inv-bar-item' onClick={() => Taro.reLaunch({ url: '/pages/my/index' })}>
          <Text className='inv-bar-label'>我的</Text>
        </View>
      </View>
    </View>
  );
}
