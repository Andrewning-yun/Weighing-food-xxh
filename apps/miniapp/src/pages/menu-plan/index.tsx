import { ScrollView, Text, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import DatePickerPopup from '../../components/DatePickerPopup';
import MenuActionBar from '../../components/MenuActionBar';
import PopupPanel from '../../components/PopupPanel';
import ScoreFab from '../../components/ScoreFab';
import TabBar from '../../components/TabBar';
import { fetchRecommendations, type RecommendationDish } from '../../api/costing';
import { fetchDishes, type DishSummary } from '../../api/dish';
import {
  createMenuPlan,
  fetchMenuPlans,
  publishMenuPlan,
  updateMenuPlan,
  type MenuPairingGap,
  type MenuPlan,
  type MenuPlanDish,
  type MenuPlanScoreSummary,
} from '../../api/menu-plan';
import {
  createSupplementaryOrder,
  deleteSupplementaryOrder,
  fetchSupplementaryOrders,
  type SupplementaryOrder,
} from '../../api/supplementary-order';
import { formatRoleLabel, getActiveStoreId, getSessionUser, hasSession } from '../../utils/session';
import { canEditMealType, isReadOnly } from '../../utils/role-guard';
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

type MealTab = 'breakfast' | 'lunch';
type RecommendMode = 'balanced' | 'margin' | 'diversity';

interface DateItem {
  label: string;
  weekday: string;
  value: string;
  isToday: boolean;
}

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildDateOptions(selectedDate: string): DateItem[] {
  const center = new Date(`${selectedDate}T00:00:00`);
  const today = toDateStr(new Date());
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return Array.from({ length: 15 }, (_, index) => {
    const date = new Date(center);
    date.setDate(center.getDate() + index - 7);
    const value = toDateStr(date);
    return {
      label: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`,
      weekday: weekdays[date.getDay()],
      value,
      isToday: value === today,
    };
  });
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${value} ${weekdays[date.getDay()]}`;
}

function getWeightLabel(weight?: number): string {
  if (weight === 3) return '重点推荐';
  if (weight === 2) return '推荐';
  return '普通';
}

function getWeightStars(weight?: number): string {
  if (weight === 3) return '★★★';
  if (weight === 2) return '★★';
  if (weight === 1) return '★';
  return '';
}

function getWeightClass(weight?: number): string {
  if (weight === 3) return 'mp-weight--featured';
  if (weight === 2) return 'mp-weight--recommend';
  return 'mp-weight--normal';
}

function sortRecommendations(items: RecommendationDish[], mode: RecommendMode) {
  const cloned = [...items];

  if (mode === 'margin') {
    return cloned.sort((a, b) => b.expectedMargin - a.expectedMargin || b.score - a.score);
  }

  if (mode === 'diversity') {
    return cloned.sort((a, b) => {
      const diversityScoreA = (a.dishTypeTag ? 1 : 0) + new Set(a.reasons).size;
      const diversityScoreB = (b.dishTypeTag ? 1 : 0) + new Set(b.reasons).size;
      return diversityScoreB - diversityScoreA || b.score - a.score;
    });
  }

  return cloned.sort((a, b) => b.score - a.score);
}

export default function MenuPlanPage() {
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [mealTab, setMealTab] = useState<MealTab>('lunch');
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [menuPlans, setMenuPlans] = useState<MenuPlan[]>([]);
  const [allDishes, setAllDishes] = useState<DishSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendMode, setRecommendMode] = useState<RecommendMode>('balanced');
  const [recommendations, setRecommendations] = useState<RecommendationDish[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [supplementOpen, setSupplementOpen] = useState(false);
  const [supplementOrders, setSupplementOrders] = useState<SupplementaryOrder[]>([]);
  const [supplementLoading, setSupplementLoading] = useState(false);
  const [supplementReason, setSupplementReason] = useState('');
  const [supplementQty, setSupplementQty] = useState<number | undefined>(undefined);

  const user = getSessionUser();
  const role = (user?.role || '') as Role;
  const userStation = user?.station || '';
  const filterByStation = Boolean(userStation) && role !== 'admin' && role !== 'chef_manager';
  const canSupplement = Boolean(userStation) && !readOnly && canEditCurrentMeal;
  const supplementDishes = useMemo(() => {
    if (!canSupplement) return [];
    return allDishes.filter((dish) => {
      if (dish.isActive === false) return false;
      if (dish.mealType && dish.mealType !== mealTab) return false;
      if (userStation && dish.station !== userStation) return false;
      return true;
    });
  }, [allDishes, canSupplement, mealTab, userStation]);
  const storeId = getActiveStoreId(user);
  const readOnly = isReadOnly(role);
  const canEditCurrentMeal = canEditMealType(role, mealTab);

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }
    void loadData();
  }, [selectedDate, mealTab]);

  async function loadData() {
    setBusy(true);
    setMessage('');

    try {
      const [planData, dishData] = await Promise.all([
        fetchMenuPlans({ storeId, date: selectedDate, mealType: mealTab }).catch(() => [] as MenuPlan[]),
        fetchDishes().catch(() => [] as DishSummary[]),
      ]);
      setMenuPlans(planData);
      setAllDishes(dishData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载菜单计划失败');
    } finally {
      setBusy(false);
    }
  }

  async function loadRecommendations() {
    setRecommendLoading(true);
    setMessage('');
    try {
      const groups = await fetchRecommendations({
        storeId,
        date: selectedDate,
        mealType: mealTab,
      });
      const group = groups.find((item) => item.mealType === mealTab) || groups[0];
      setRecommendations(group?.dishes || []);
    } catch (error) {
      setRecommendations([]);
      setMessage(error instanceof Error ? error.message : '加载推荐菜失败');
    } finally {
      setRecommendLoading(false);
    }
  }

  const currentPlan = menuPlans[0] || null;

  const planDishes = useMemo(() => {
    if (!currentPlan?.dishes) return [];
    const dishMap = new Map<string, DishSummary>();
    allDishes.forEach((dish) => dishMap.set(dish.id, dish));
    return currentPlan.dishes
      .map((planDish) => {
        const dish = dishMap.get(planDish.dishId);
        return dish ? { ...dish, planQuantity: planDish.quantity } : null;
      })
      .filter((dish): dish is DishSummary & { planQuantity: number } => Boolean(dish));
  }, [allDishes, currentPlan]);

  const groupedPlanDishes = useMemo(() => {
    const grouped = new Map<string, Array<DishSummary & { planQuantity: number }>>();
    planDishes.forEach((dish) => {
      const current = grouped.get(dish.category) || [];
      current.push(dish);
      grouped.set(dish.category, current);
    });
    return Array.from(grouped.entries()).map(([category, dishes]) => ({ category, dishes }));
  }, [planDishes]);

  const existingIds = useMemo(
    () => new Set((currentPlan?.dishes || []).map((dish) => dish.dishId)),
    [currentPlan],
  );

  const searchableDishes = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    if (!normalizedKeyword || !canEditCurrentMeal || readOnly) {
      return [];
    }

    return allDishes.filter((dish) => {
      if (existingIds.has(dish.id) || dish.isActive === false) {
        return false;
      }

      if (dish.mealType && dish.mealType !== mealTab) {
        return false;
      }

      if (filterByStation && dish.station !== userStation) {
        return false;
      }

      const haystack = [dish.name, dish.category, dish.station, dish.description || '', dish.dishTypeTag || '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [allDishes, canEditCurrentMeal, existingIds, mealTab, readOnly, searchKeyword]);

  const filteredRecommendations = useMemo(
    () =>
      sortRecommendations(
        recommendations.filter((dish) => !existingIds.has(dish.dishId)),
        recommendMode,
      ),
    [existingIds, recommendMode, recommendations],
  );

  const canPublishCurrentPlan =
    Boolean(currentPlan) && !readOnly && canEditCurrentMeal && currentPlan?.status !== 'published';

  async function persistPlan(nextDishes: MenuPlanDish[]) {
    if (currentPlan) {
      await updateMenuPlan(currentPlan.id, { dishes: nextDishes });
    } else {
      await createMenuPlan({
        storeId,
        date: selectedDate,
        mealType: mealTab,
        dishes: nextDishes,
      });
    }
  }

  async function handleAddDish(dishId: string) {
    if (!canEditCurrentMeal || readOnly || !storeId) return;
    setSubmitting(true);
    setMessage('');

    try {
      const nextDishes: MenuPlanDish[] = [...(currentPlan?.dishes || []), { dishId, quantity: 1 }];
      await persistPlan(nextDishes);
      setSearchKeyword('');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '添加菜品失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdjustQuantity(dishId: string, delta: number) {
    if (!currentPlan || !canEditCurrentMeal || readOnly) return;
    setSubmitting(true);
    setMessage('');

    try {
      const nextDishes = (currentPlan.dishes || []).map((dish) =>
        dish.dishId === dishId
          ? { ...dish, quantity: Math.max(1, (dish.quantity || 1) + delta) }
          : dish,
      );
      await updateMenuPlan(currentPlan.id, { dishes: nextDishes });
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '调整数量失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveDish(dishId: string) {
    if (!currentPlan || !canEditCurrentMeal || readOnly) return;
    setSubmitting(true);
    setMessage('');
    try {
      const nextDishes = (currentPlan.dishes || []).filter((dish) => dish.dishId !== dishId);
      await updateMenuPlan(currentPlan.id, { dishes: nextDishes });
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '移除菜品失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublishPlan() {
    if (!currentPlan || !canPublishCurrentPlan) return;
    setPublishing(true);
    setMessage('');
    try {
      await publishMenuPlan(currentPlan.id);
      await loadData();
      setMessage('菜单已发布');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发布菜单失败');
    } finally {
      setPublishing(false);
    }
  }

  async function loadSupplementOrders() {
    if (!currentPlan?.id) return;
    setSupplementLoading(true);
    try {
      const orders = await fetchSupplementaryOrders({ menuPlanId: currentPlan.id });
      setSupplementOrders(orders);
    } catch {
      setSupplementOrders([]);
    } finally {
      setSupplementLoading(false);
    }
  }

  async function handleCreateSupplement(dishId: string, dishName: string) {
    if (!currentPlan?.id) return;
    setSupplementLoading(true);
    setMessage('');
    try {
      await createSupplementaryOrder({
        menuPlanId: currentPlan.id,
        dishId,
        dishName,
        reason: supplementReason || undefined,
        estimatedQuantity: supplementQty ?? undefined,
      });
      setSupplementReason('');
      setSupplementQty(undefined);
      await loadSupplementOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '补单失败');
    } finally {
      setSupplementLoading(false);
    }
  }

  async function handleDeleteSupplement(id: string) {
    setSupplementLoading(true);
    try {
      await deleteSupplementaryOrder(id);
      setSupplementOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '撤销补单失败');
    } finally {
      setSupplementLoading(false);
    }
  }

  const mealTabLabel = mealTab === 'breakfast' ? '早餐' : '正餐';
  const scoreSummary: MenuPlanScoreSummary | null = currentPlan?.menuScore || null;
  const pairingGaps: MenuPairingGap[] = currentPlan?.pairingGaps || [];
  const dateOptions = useMemo(() => buildDateOptions(selectedDate), [selectedDate]);

  return (
    <View className='menuplan-screen'>
      <MenuActionBar
        dateLabel={formatDateLabel(selectedDate)}
        mealType={mealTab}
        onOpenDatePicker={() => setDatePickerOpen(true)}
        onChangeMealType={setMealTab}
      />

      <View className='mp-hero'>
        <View>
          <Text className='mp-title'>菜单</Text>
          <Text className='mp-subtitle'>{user?.storeName || user?.storeId || '未绑定门店'}</Text>
          <Text className='mp-role'>{formatRoleLabel(role)}</Text>
        </View>
        {canPublishCurrentPlan ? (
          <NutButton size='mini' loading={publishing} onClick={handlePublishPlan}>
            发布
          </NutButton>
        ) : null}
      </View>

      <View className='mp-search-panel'>
        <NutInput
          className='mp-search-input'
          placeholder='搜索菜品名称、分类、标签'
          value={searchKeyword}
          onChange={(v) => setSearchKeyword(v)}
        />
        <Text
          className='mp-recommend-trigger'
          onClick={() => {
            setRecommendOpen(true);
            void loadRecommendations();
          }}
        >
          推荐菜
        </Text>
        {canSupplement && currentPlan ? (
          <Text
            className='mp-recommend-trigger'
            onClick={() => {
              setSupplementOpen(true);
              void loadSupplementOrders();
            }}
          >
            补单
          </Text>
        ) : null}
      </View>

      {searchKeyword && canEditCurrentMeal && !readOnly ? (
        <View className='mp-search-result-panel'>
          {searchableDishes.length > 0 ? (
            searchableDishes.slice(0, 10).map((dish) => (
              <View key={dish.id} className='mp-search-item'>
                <View className='mp-search-item-info'>
                  <Text className='mp-search-item-name'>{dish.name}</Text>
                  <Text className='mp-search-item-meta'>
                    {dish.category}
                    {dish.dishTypeTag ? ` · ${dish.dishTypeTag}` : ''}
                  </Text>
                </View>
                <Text className='mp-search-item-add' onClick={() => (submitting ? null : handleAddDish(dish.id))}>
                  添加
                </Text>
              </View>
            ))
          ) : (
            <Text className='mp-search-empty'>没有匹配到可添加的菜品</Text>
          )}
        </View>
      ) : null}

      {message ? <Text className='mp-message'>{message}</Text> : null}

      {busy ? (
        <View className='mp-loading'>
          <Text className='mp-loading-text'>正在加载菜单...</Text>
        </View>
      ) : null}

      {!busy && groupedPlanDishes.length > 0 ? (
        <View className='mp-dish-list'>
          {groupedPlanDishes.map((group) => (
            <View key={group.category} className='mp-category-block'>
              <Text className='mp-category-title'>{group.category}</Text>
              {group.dishes.map((dish) => (
                <View key={dish.id} className='mp-dish-card'>
                  <View className='mp-dish-main'>
                    <View className='mp-dish-info'>
                      <Text className='mp-dish-name'>{dish.name}</Text>
                      <Text className='mp-dish-station'>{dish.station}</Text>
                    </View>
                    <View className='mp-dish-right'>
                      <Text className='mp-dish-stars'>{getWeightStars(dish.recommendWeight)}</Text>
                      <Text className={`mp-weight-badge ${getWeightClass(dish.recommendWeight)}`}>
                        {getWeightLabel(dish.recommendWeight)}
                      </Text>
                    </View>
                  </View>

                  <View className='mp-dish-bottom'>
                    <View className='mp-stepper'>
                      <Text className='mp-stepper-btn' onClick={() => (submitting ? null : handleAdjustQuantity(dish.id, -1))}>
                        -
                      </Text>
                      <Text className='mp-stepper-value'>{dish.planQuantity}</Text>
                      <Text className='mp-stepper-btn' onClick={() => (submitting ? null : handleAdjustQuantity(dish.id, 1))}>
                        +
                      </Text>
                    </View>
                    {canEditCurrentMeal && !readOnly ? (
                      <Text className='mp-btn-remove' onClick={() => (submitting ? null : handleRemoveDish(dish.id))}>
                        移除
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {!busy && planDishes.length === 0 ? (
        <View className='mp-empty'>
          <Text className='mp-empty-title'>当前还没有{mealTabLabel}菜品</Text>
          <Text className='mp-empty-text'>
            {canEditCurrentMeal && !readOnly ? '请先搜索或从推荐菜里添加。' : '当前角色只能查看该餐别菜单。'}
          </Text>
        </View>
      ) : null}

      {!canEditCurrentMeal && !readOnly ? (
        <View className='mp-role-hint'>
          <Text className='mp-role-hint-text'>当前角色只能查看{mealTabLabel}菜单，不能编辑。</Text>
        </View>
      ) : null}

      <DatePickerPopup
        open={datePickerOpen}
        selectedDate={selectedDate}
        options={dateOptions}
        onClose={() => setDatePickerOpen(false)}
        onSelect={(value) => {
          setSelectedDate(value);
          setDatePickerOpen(false);
        }}
      />

      <PopupPanel open={recommendOpen} title='推荐菜' onClose={() => setRecommendOpen(false)} compact>
        <View className='mp-recommend-tabs'>
          <Text
            className={`mp-recommend-tab ${recommendMode === 'balanced' ? 'mp-recommend-tab-active' : ''}`}
            onClick={() => setRecommendMode('balanced')}
          >
            均衡搭配
          </Text>
          <Text
            className={`mp-recommend-tab ${recommendMode === 'margin' ? 'mp-recommend-tab-active' : ''}`}
            onClick={() => setRecommendMode('margin')}
          >
            高毛利
          </Text>
          <Text
            className={`mp-recommend-tab ${recommendMode === 'diversity' ? 'mp-recommend-tab-active' : ''}`}
            onClick={() => setRecommendMode('diversity')}
          >
            食材多样
          </Text>
        </View>

        {recommendLoading ? (
          <Text className='mp-recommend-empty'>正在加载推荐菜...</Text>
        ) : filteredRecommendations.length > 0 ? (
          <View className='mp-recommend-list'>
            {filteredRecommendations.slice(0, 12).map((dish) => (
              <View key={dish.dishId} className='mp-recommend-item'>
                <View className='mp-recommend-item-info'>
                  <Text className='mp-recommend-item-name'>{dish.name || dish.dishName}</Text>
                  <Text className='mp-recommend-item-meta'>
                    {dish.category}
                    {dish.dishTypeTag ? ` · ${dish.dishTypeTag}` : ''} · 评分 {dish.score}
                  </Text>
                  {dish.reasons?.length ? (
                    <Text className='mp-recommend-item-reason'>{dish.reasons.join('、')}</Text>
                  ) : null}
                </View>
                <Text
                  className='mp-recommend-item-add'
                  onClick={() => {
                    void handleAddDish(dish.dishId);
                    setRecommendOpen(false);
                  }}
                >
                  添加
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className='mp-recommend-empty'>当前没有可推荐的菜品</Text>
        )}
      </PopupPanel>

      <PopupPanel open={supplementOpen} title='补单' onClose={() => setSupplementOpen(false)} compact>
        <View className='mp-supplement-panel'>
          <View className='mp-supplement-form'>
            <Text className='mp-supplement-label'>补单原因</Text>
            <NutInput
              className='mp-search-input'
              placeholder='如：菜品售罄、客流超预期'
              value={supplementReason}
              onChange={(v) => setSupplementReason(v)}
            />
            <Text className='mp-supplement-label'>预估份数（可选）</Text>
            <NutInput
              className='mp-search-input'
              placeholder='输入数字'
              value={supplementQty !== undefined ? String(supplementQty) : ''}
              onChange={(v) => {
                const n = Number(v);
                setSupplementQty(v === '' ? undefined : Number.isNaN(n) ? undefined : n);
              }}
            />
          </View>

          <Text className='mp-supplement-section-title'>可选菜品（{userStation || '当前工位'}）</Text>
          {supplementDishes.length > 0 ? (
            <View className='mp-recommend-list'>
              {supplementDishes.slice(0, 15).map((dish) => (
                <View key={dish.id} className='mp-recommend-item'>
                  <View className='mp-recommend-item-info'>
                    <Text className='mp-recommend-item-name'>{dish.name}</Text>
                    <Text className='mp-recommend-item-meta'>
                      {dish.category}
                      {dish.dishTypeTag ? ` · ${dish.dishTypeTag}` : ''}
                    </Text>
                  </View>
                  <Text
                    className='mp-recommend-item-add'
                    onClick={() => {
                      void handleCreateSupplement(dish.id, dish.name);
                    }}
                  >
                    补单
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className='mp-recommend-empty'>当前工位没有可选菜品</Text>
          )}

          <Text className='mp-supplement-section-title'>
            已补单记录
            {supplementOrders.length > 0 ? ` (${supplementOrders.length})` : ''}
          </Text>
          {supplementLoading ? (
            <Text className='mp-recommend-empty'>加载中...</Text>
          ) : supplementOrders.length > 0 ? (
            <View className='mp-recommend-list'>
              {supplementOrders.map((order) => (
                <View key={order.id} className='mp-recommend-item'>
                  <View className='mp-recommend-item-info'>
                    <Text className='mp-recommend-item-name'>{order.dishName}</Text>
                    <Text className='mp-recommend-item-meta'>
                      {order.userName}
                      {order.estimatedQuantity ? ` · ${order.estimatedQuantity}份` : ''}
                    </Text>
                    {order.reason ? (
                      <Text className='mp-recommend-item-reason'>{order.reason}</Text>
                    ) : null}
                  </View>
                  <Text
                    className='mp-recommend-item-add'
                    style={{ color: '#e34d59' }}
                    onClick={() => {
                      void handleDeleteSupplement(order.id);
                    }}
                  >
                    撤销
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className='mp-recommend-empty'>暂无补单记录</Text>
          )}
        </View>
      </PopupPanel>

      <ScoreFab scoreSummary={scoreSummary} pairingGaps={pairingGaps} />
      <TabBar current='menu-plan' />
    </View>
  );
}
