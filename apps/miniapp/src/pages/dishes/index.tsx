import { Image, Text, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { me } from '../../api/auth';
import { createDish, fetchDish, fetchDishes, type DishSummary } from '../../api/dish';
import {
  clearSession,
  formatSessionUser,
  getSessionUser,
  hasSession,
  setSessionUser,
  toSessionUser,
} from '../../utils/session';
import './index.scss';

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function createLoadingCards() {
  return Array.from({ length: 3 }, (_, index) => index);
}

function formatCurrency(value?: number, digits = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return value.toFixed(digits);
}

export default function DishesPage() {
  const [items, setItems] = useState<DishSummary[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(true);
  const [copyingId, setCopyingId] = useState('');
  const [userSummary, setUserSummary] = useState('');
  const [keyword, setKeyword] = useState('');
  const [mealFilter, setMealFilter] = useState<'all' | 'breakfast' | 'lunch'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [expandedDishId, setExpandedDishId] = useState('');

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    void bootstrap();
  }, []);

  async function hydrateSession() {
    try {
      const profile = await me();
      const sessionUser = toSessionUser(profile);
      setSessionUser(sessionUser);
      setUserSummary(formatSessionUser(sessionUser));
    } catch {
      setUserSummary(formatSessionUser(getSessionUser()));
    }
  }

  async function loadDishes() {
    const data = await fetchDishes();
    setItems(data);
    return data;
  }

  async function bootstrap() {
    setBusy(true);
    setMessage('');

    try {
      await hydrateSession();
      await loadDishes();
    } catch (error) {
      setItems([]);
      setMessage(error instanceof Error ? error.message : '菜品加载失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    setBusy(true);
    setMessage('');
    try {
      await loadDishes();
    } catch (error) {
      setItems([]);
      setMessage(error instanceof Error ? error.message : '菜品加载失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyDish(id: string) {
    setCopyingId(id);
    setMessage('');
    try {
      const detail = await fetchDish(id);
      await createDish({
        name: `${detail.name}副本`,
        category: detail.category,
        station: detail.station,
        description: detail.description || '',
        mealType: detail.mealType || 'lunch',
        recommendWeight: (detail.recommendWeight || 1) as 1 | 2 | 3,
        relatedIngredients: detail.relatedIngredients || '',
        dishTypeTag: detail.dishTypeTag || undefined,
        isActive: detail.isActive,
        ingredients: (detail.ingredients || []).map((item) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
          wasteRate: item.wasteRate,
        })),
        steps: (detail.steps || []).map((item, index) => ({
          id: index + 1,
          title: item.title,
          description: item.description,
          duration: item.duration,
          station: item.station,
        })),
      });
      Taro.showToast({ title: '已复制为新菜品', icon: 'success' });
      await loadDishes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '复制菜品失败');
    } finally {
      setCopyingId('');
    }
  }

  const categoryOptions = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.category).filter(Boolean)))],
    [items],
  );
  const tagOptions = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.dishTypeTag).filter(Boolean) as string[]))],
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return items.filter((item) => {
      if (mealFilter !== 'all' && item.mealType !== mealFilter) return false;
      if (statusFilter === 'active' && item.isActive === false) return false;
      if (statusFilter === 'inactive' && item.isActive !== false) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (tagFilter !== 'all' && (item.dishTypeTag || '') !== tagFilter) return false;
      if (!normalizedKeyword) return true;
      const haystack = [item.name, item.category, item.station, item.description || '', item.dishTypeTag || '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [items, keyword, mealFilter, statusFilter, categoryFilter, tagFilter]);

  const activeCount = filteredItems.filter((item) => item.isActive !== false).length;
  const totalSteps = filteredItems.reduce((sum, item) => sum + (item.steps?.length || 0), 0);
  const totalIngredients = filteredItems.reduce((sum, item) => sum + (item.ingredients?.length || 0), 0);
  const canEdit = ['admin', 'chef_manager'].includes(getSessionUser()?.role || '');

  return (
    <View className='screen menu-screen'>
      <View className='shell-card menu-hero'>
        <View>
          <Text className='eyebrow'>菜品工作台</Text>
          <Text className='menu-title'>菜品库</Text>
          <Text className='menu-subtitle'>{userSummary || '当前登录会话'}</Text>
        </View>
        <View className='menu-kpis'>
          <View className='menu-kpi'>
            <Text className='menu-kpi-label'>当前显示</Text>
            <Text className='menu-kpi-value'>{filteredItems.length}</Text>
          </View>
          <View className='menu-kpi'>
            <Text className='menu-kpi-label'>启用菜品</Text>
            <Text className='menu-kpi-value'>{activeCount}</Text>
          </View>
          <View className='menu-kpi'>
            <Text className='menu-kpi-label'>食材总数</Text>
            <Text className='menu-kpi-value'>{totalIngredients}</Text>
          </View>
          <View className='menu-kpi'>
            <Text className='menu-kpi-label'>步骤总数</Text>
            <Text className='menu-kpi-value'>{totalSteps}</Text>
          </View>
        </View>
      </View>

      <View className='shell-card menu-toolbar'>
        <NutInput
          className='menu-search'
          placeholder='搜索菜品名称、分类、工位、标签'
          value={keyword}
          onChange={(v) => setKeyword(v)}
        />

        <View className='menu-filter-grid'>
          <View className='menu-chip-row'>
            {(['all', 'breakfast', 'lunch'] as const).map((item) => (
              <Text key={item} className={`menu-filter-chip ${mealFilter === item ? 'menu-filter-chip-active' : ''}`} onClick={() => setMealFilter(item)}>
                {item === 'all' ? '全部餐别' : item === 'breakfast' ? '早餐' : '正餐'}
              </Text>
            ))}
          </View>
          <View className='menu-chip-row'>
            {(['all', 'active', 'inactive'] as const).map((item) => (
              <Text key={item} className={`menu-filter-chip ${statusFilter === item ? 'menu-filter-chip-active' : ''}`} onClick={() => setStatusFilter(item)}>
                {item === 'all' ? '全部状态' : item === 'active' ? '启用' : '停用'}
              </Text>
            ))}
          </View>
          <View className='menu-chip-row'>
            {categoryOptions.slice(0, 6).map((item) => (
              <Text key={item} className={`menu-filter-chip ${categoryFilter === item ? 'menu-filter-chip-active' : ''}`} onClick={() => setCategoryFilter(item)}>
                {item === 'all' ? '全部分类' : item}
              </Text>
            ))}
          </View>
          <View className='menu-chip-row'>
            {tagOptions.slice(0, 5).map((item) => (
              <Text key={item} className={`menu-filter-chip ${tagFilter === item ? 'menu-filter-chip-active' : ''}`} onClick={() => setTagFilter(item)}>
                {item === 'all' ? '全部标签' : item}
              </Text>
            ))}
          </View>
        </View>

        <View className='menu-actions'>
          <NutButton size='mini' onClick={handleRefresh} loading={busy}>
            刷新
          </NutButton>
          {canEdit ? (
            <NutButton size='mini' onClick={() => Taro.navigateTo({ url: '/pages/dish-edit/index' })}>
              新建
            </NutButton>
          ) : null}
          <NutButton size='mini' onClick={() => Taro.reLaunch({ url: '/pages/my/index' })}>
            个人中心
          </NutButton>
          <NutButton size='mini' onClick={() => { clearSession(); redirectToLogin(); }}>
            退出
          </NutButton>
        </View>
      </View>

      {message ? <Text className='menu-message'>{message}</Text> : null}

      {busy ? (
        <View className='menu-loading-list'>
          {createLoadingCards().map((index) => (
            <View key={index} className='shell-card menu-loading-card'>
              <View className='menu-loading-line menu-loading-title' />
              <View className='menu-loading-line menu-loading-copy' />
              <View className='menu-loading-line menu-loading-copy short' />
              <View className='menu-loading-grid'>
                <View className='menu-loading-line menu-loading-meta' />
                <View className='menu-loading-line menu-loading-meta' />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {!busy && filteredItems.length === 0 ? (
        <View className='shell-card menu-empty-card'>
          <Text className='menu-empty-title'>没有匹配结果</Text>
          <Text className='menu-empty-text'>请调整筛选条件或搜索关键词。</Text>
        </View>
      ) : null}

      <View className='menu-list'>
        {filteredItems.map((item) => {
          const expanded = expandedDishId === item.id;
          return (
            <View key={item.id} className='shell-card menu-card'>
              <View className='menu-card-top' onClick={() => setExpandedDishId(expanded ? '' : item.id)}>
                <View className='menu-card-body'>
                  <Text className='menu-card-title'>{item.name}</Text>
                  <Text className='menu-card-description'>
                    {item.category} · {item.mealType === 'breakfast' ? '早餐' : '正餐'}
                    {item.dishTypeTag ? ` · ${item.dishTypeTag}` : ''}
                  </Text>
                </View>
                <Text className='menu-chip'>{expanded ? '收起' : item.isActive === false ? '停用' : '展开'}</Text>
              </View>

              {expanded ? (
                <View className='menu-expand-panel'>
                  <View className='menu-cover'>
                    {item.coverImageUrl ? (
                      <Image className='menu-cover-image' src={item.coverImageUrl} mode='aspectFill' />
                    ) : (
                      <View className='menu-cover-placeholder'>
                        <Text className='menu-cover-placeholder-title'>暂无封面</Text>
                      </View>
                    )}
                  </View>

                  <View className='menu-meta-grid'>
                    <View className='menu-meta-item'>
                      <Text className='menu-meta-label'>分类</Text>
                      <Text className='menu-meta-value'>{item.category}</Text>
                    </View>
                    <View className='menu-meta-item'>
                      <Text className='menu-meta-label'>工位</Text>
                      <Text className='menu-meta-value'>{item.station}</Text>
                    </View>
                    <View className='menu-meta-item'>
                      <Text className='menu-meta-label'>食材成本</Text>
                      <Text className='menu-meta-value'>{formatCurrency(item.ingredientCost, 1)}</Text>
                    </View>
                  </View>

                  <View className='menu-card-actions-inline'>
                    {canEdit ? (
                      <>
                        <NutButton size='mini' onClick={() => Taro.navigateTo({ url: `/pages/dish-edit/index?id=${item.id}` })}>
                          编辑补全
                        </NutButton>
                        <NutButton size='mini' loading={copyingId === item.id} onClick={() => void handleCopyDish(item.id)}>
                          复制为新菜品
                        </NutButton>
                      </>
                    ) : null}
                  </View>

                  <View className='menu-detail-block'>
                    <Text className='menu-detail-title'>食材列表</Text>
                    {item.ingredients?.length ? (
                      item.ingredients.map((ingredient) => (
                        <View key={`${item.id}-${ingredient.ingredientId}`} className='menu-detail-row'>
                          <Text className='menu-detail-name'>{ingredient.ingredientId}</Text>
                          <Text className='menu-detail-value'>
                            {ingredient.quantity} {ingredient.unit}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text className='menu-detail-empty'>暂无食材</Text>
                    )}
                  </View>

                  <View className='menu-detail-block'>
                    <Text className='menu-detail-title'>步骤列表</Text>
                    {item.steps?.length ? (
                      item.steps.map((step, index) => (
                        <View key={`${item.id}-${step.id || index}`} className='menu-detail-step'>
                          <Text className='menu-detail-step-title'>
                            {index + 1}. {step.title}
                          </Text>
                          <Text className='menu-detail-step-desc'>{step.description}</Text>
                        </View>
                      ))
                    ) : (
                      <Text className='menu-detail-empty'>暂无步骤</Text>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
