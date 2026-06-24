import { ScrollView, Text, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchMenuStandards,
  updateMenuStandards,
  type MenuStandardItem,
  type MenuStandardMealType,
} from '../../api/menu-standard';
import request from '../../api/request';
import { getActiveStoreId, getActiveStoreName, getSessionUser, hasSession, setActiveStore } from '../../utils/session';
import './index.scss';

interface StoreRecord {
  id: string;
  name: string;
}

const DEFAULT_BREAKFAST = ['粥品', '面点', '早餐饮品', '小菜'];
const DEFAULT_LUNCH = ['大荤', '小荤', '素菜', '凉菜', '汤品', '水果'];

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function createDefaults(mealType: MenuStandardMealType): MenuStandardItem[] {
  const source = mealType === 'breakfast' ? DEFAULT_BREAKFAST : DEFAULT_LUNCH;
  return source.map((category) => ({ category, targetCount: 1, remark: '' }));
}

async function fetchStores() {
  return request<StoreRecord[]>({
    url: '/stores',
    auth: true,
  });
}

export default function MenuStandardPage() {
  const user = getSessionUser();
  const role = user?.role || '';
  const canSave = ['admin', 'chef_manager', 'store_manager'].includes(role);
  const [storeId, setStoreId] = useState(getActiveStoreId(user));
  const [mealType, setMealType] = useState<MenuStandardMealType>('lunch');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [items, setItems] = useState<MenuStandardItem[]>(createDefaults('lunch'));

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }
    void bootstrap();
  }, []);

  useEffect(() => {
    void loadStandards();
  }, [storeId, mealType]);

  async function bootstrap() {
    try {
      const data = await fetchStores().catch(() => [] as StoreRecord[]);
      setStores(data);
    } finally {
      setBusy(false);
    }
  }

  async function loadStandards() {
    if (!storeId) {
      setItems(createDefaults(mealType));
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const data = await fetchMenuStandards(storeId, mealType);
      setItems(data.length > 0 ? data : createDefaults(mealType));
    } catch (error) {
      setItems(createDefaults(mealType));
      setMessage(error instanceof Error ? error.message : '加载菜单标准失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!canSave || !storeId || saving) {
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await updateMenuStandards({
        storeId,
        mealType,
        items,
      });
      Taro.showToast({ title: '标准已保存', icon: 'success' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存菜单标准失败');
    } finally {
      setSaving(false);
    }
  }

  const currentStoreName = useMemo(
    () => stores.find((item) => item.id === storeId)?.name || getActiveStoreName(user) || user?.storeName || user?.storeId || '未选择门店',
    [storeId, stores, user],
  );

  return (
    <View className='standard-page'>
      <View className='shell-card std-hero'>
        <View>
          <Text className='std-eyebrow'>菜单标准</Text>
          <Text className='std-title'>标准配置</Text>
          <Text className='std-subtitle'>{currentStoreName}</Text>
        </View>
        <NutButton size='mini' onClick={loadStandards} loading={busy}>
          刷新
        </NutButton>
      </View>

      <ScrollView scrollX className='std-chip-scroll'>
        <View className='std-chip-row'>
          {stores.map((store) => (
            <Text
              key={store.id}
              className={`std-chip ${storeId === store.id ? 'std-chip-active' : ''}`}
              onClick={() => {
                setStoreId(store.id);
                setActiveStore(store.id, store.name);
              }}
            >
              {store.name}
            </Text>
          ))}
        </View>
      </ScrollView>

      <View className='std-meal-tabs'>
        <Text className={`std-tab ${mealType === 'breakfast' ? 'std-tab-active' : ''}`} onClick={() => setMealType('breakfast')}>
          早餐
        </Text>
        <Text className={`std-tab ${mealType === 'lunch' ? 'std-tab-active' : ''}`} onClick={() => setMealType('lunch')}>
          正餐
        </Text>
      </View>

      {!canSave ? <Text className='std-tip'>当前角色只可查看，保存权限以后端实际权限为准。</Text> : null}
      {message ? <Text className='std-message'>{message}</Text> : null}

      <View className='shell-card std-table'>
        {items.map((item, index) => (
          <View key={`${item.category}-${index}`} className='std-row'>
            <Text className='std-category'>{item.category}</Text>
            <NutInput
              className='std-input'
              type='number'
              value={String(item.targetCount)}
              onChange={(v) =>
                setItems((prev) =>
                  prev.map((current, currentIndex) =>
                    currentIndex === index ? { ...current, targetCount: Number(v) || 0 } : current,
                  ),
                )
              }
            />
            <NutInput
              className='std-input'
              placeholder='备注'
              value={item.remark || ''}
              onChange={(v) =>
                setItems((prev) =>
                  prev.map((current, currentIndex) =>
                    currentIndex === index ? { ...current, remark: v } : current,
                  ),
                )
              }
            />
          </View>
        ))}
      </View>

      <View className='std-actions'>
        <NutButton
          onClick={() =>
            setItems((prev) => [...prev, { category: `新增分类${prev.length + 1}`, targetCount: 1, remark: '' }])
          }
        >
          新增一行
        </NutButton>
        <NutButton type='primary' disabled={!canSave} loading={saving} onClick={handleSave}>
          保存标准
        </NutButton>
      </View>
    </View>
  );
}
