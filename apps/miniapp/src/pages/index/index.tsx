import { ScrollView, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import TabBar from '../../components/TabBar';
import { fetchDailyMetrics } from '../../api/daily-report';
import { fetchDishes, type DishSummary } from '../../api/dish';
import { fetchMenuPlans, type MenuPlan } from '../../api/menu-plan';
import { fetchTasks, type Task } from '../../api/task';
import { getTodayDateStr, getWeekdayLabel, getYesterdayDateStr } from '../../utils/date';
import { clearSession, formatRoleLabel, getActiveStoreId, getSessionUser, hasSession } from '../../utils/session';
import { canAccessPage } from '../../utils/role-guard';
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

interface GroupedDish {
  category: string;
  dishes: DishSummary[];
}

interface GroupedMenu {
  mealType: string;
  groups: GroupedDish[];
}

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function formatMealType(mealType: string): string {
  return mealType === 'breakfast' ? '早餐' : '正餐';
}

function formatTaskStatus(status: string) {
  if (status === 'pending') return '待处理';
  if (status === 'in_progress') return '进行中';
  if (status === 'completed') return '已完成';
  return '未知状态';
}

export default function IndexPage() {
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [menuPlans, setMenuPlans] = useState<MenuPlan[]>([]);
  const [dishes, setDishes] = useState<DishSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reportMissingMeals, setReportMissingMeals] = useState<string[]>([]);
  const today = getTodayDateStr();

  const user = getSessionUser();
  const role = (user?.role || '') as Role;
  const storeId = getActiveStoreId(user);

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    void bootstrap();
  }, []);

  async function bootstrap() {
    setBusy(true);
    setMessage('');

    try {
      const [planData, dishData, taskData] = await Promise.all([
        fetchMenuPlans({ storeId, date: today }).catch(() => [] as MenuPlan[]),
        fetchDishes().catch(() => [] as DishSummary[]),
        fetchTasks({ storeId, date: today }).catch(() => [] as Task[]),
      ]);

      setMenuPlans(planData);
      setDishes(dishData);
      setTasks(taskData);

      if (storeId && (role === 'admin' || role === 'store_manager')) {
        const yesterday = getYesterdayDateStr();
        const reportData = await fetchDailyMetrics({ storeId, date: yesterday }).catch(
          () => [] as Array<{ mealType?: string }>,
        );
        const reportedMeals = new Set(reportData.map((item) => item.mealType).filter(Boolean));
        const missingMeals = ['breakfast', 'lunch']
          .filter((mealType) => !reportedMeals.has(mealType))
          .map((mealType) => formatMealType(mealType));
        setReportMissingMeals(missingMeals);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '首页数据加载失败');
    } finally {
      setBusy(false);
    }
  }

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress'),
    [tasks],
  );
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === 'completed'), [tasks]);

  const groupedMenu = useMemo((): GroupedMenu[] => {
    const mealTypes = ['breakfast', 'lunch'];
    return mealTypes
      .map((mealType) => {
        const plan = menuPlans.find((item) => item.mealType === mealType);
        if (!plan?.dishes?.length) {
          return { mealType, groups: [] };
        }

        const dishMap = new Map<string, DishSummary>();
        dishes.forEach((dish) => dishMap.set(dish.id, dish));

        const planDishes = plan.dishes
          .map((planDish) => dishMap.get(planDish.dishId))
          .filter((dish): dish is DishSummary => Boolean(dish));

        const categoryMap = new Map<string, DishSummary[]>();
        planDishes.forEach((dish) => {
          const current = categoryMap.get(dish.category) || [];
          current.push(dish);
          categoryMap.set(dish.category, current);
        });

        return {
          mealType,
          groups: Array.from(categoryMap.entries()).map(([category, items]) => ({
            category,
            dishes: items,
          })),
        };
      })
      .filter((group) => group.groups.length > 0);
  }, [menuPlans, dishes]);

  function openPage(url: string, relaunch = false) {
    if (relaunch) {
      Taro.reLaunch({ url });
      return;
    }

    Taro.navigateTo({ url }).catch(() => {
      Taro.reLaunch({ url });
    });
  }

  function handleSignOut() {
    clearSession();
    redirectToLogin();
  }

  const quickActions = [
    {
      label: '每日日报',
      url: '/pages/daily-report/index',
      visible: role === 'admin' || role === 'store_manager',
    },
    {
      label: '库存填报',
      url: '/pages/inventory/index',
      visible: canAccessPage(role, 'inventory'),
    },
    {
      label: '菜品库',
      url: '/pages/dishes/index',
      visible: true,
    },
    {
      label: '数据分析',
      url: '/pages/analysis/index',
      visible: canAccessPage(role, 'analysis'),
    },
  ].filter((item) => item.visible);

  return (
    <View className='dashboard-screen'>
      <View className='dash-header-card'>
        <View className='dash-user-card'>
          <View className='dash-avatar'>门店</View>
          <View className='dash-greeting'>
            <Text className='dash-greeting-text'>{user?.displayName || user?.name || '当前用户'}</Text>
            <Text className='dash-greeting-sub'>{formatRoleLabel(role)}</Text>
          </View>
        </View>
        <View className='dash-header-actions'>
          <View className='dash-role-badge'>
            <Text className='dash-role-text'>{user?.storeName || user?.storeId || '未绑定门店'}</Text>
          </View>
        </View>
      </View>

      <View className='dash-date-card'>
        <Text className='dash-date'>
          {today} {getWeekdayLabel(today)}
        </Text>
      </View>

      <View className='dash-quick-grid'>
        {quickActions.map((item) => (
          <View key={item.url} className='dash-home-card' onClick={() => openPage(item.url)}>
            <Text className='dash-home-card-label'>{item.label}</Text>
          </View>
        ))}
      </View>

      <View className='dash-kpi-row'>
        <View className='dash-kpi-card dash-kpi-menu'>
          <Text className='dash-kpi-number'>{menuPlans.length}</Text>
          <Text className='dash-kpi-label'>今日菜单</Text>
        </View>
        <View className='dash-kpi-card dash-kpi-task'>
          <Text className='dash-kpi-number'>{pendingTasks.length}</Text>
          <Text className='dash-kpi-label'>待办任务</Text>
        </View>
        <View className='dash-kpi-card dash-kpi-done'>
          <Text className='dash-kpi-number'>{completedTasks.length}</Text>
          <Text className='dash-kpi-label'>已完成</Text>
        </View>
      </View>

      {message ? <Text className='dash-message'>{message}</Text> : null}

      {!busy && reportMissingMeals.length > 0 ? (
        <View className='dash-report-card'>
          <Text className='dash-report-title'>昨日日报未完成</Text>
          <Text className='dash-report-copy'>当前缺少 {reportMissingMeals.join('、')} 的填报，请尽快补录。</Text>
          <Text className='dash-report-link' onClick={() => openPage('/pages/daily-report/index')}>
            前往填报
          </Text>
        </View>
      ) : null}

      {busy ? (
        <View className='dash-loading'>
          <Text className='dash-loading-text'>正在加载首页数据...</Text>
        </View>
      ) : null}

      {!busy && groupedMenu.length > 0 ? (
        <View className='dash-section'>
          <View className='dash-section-header'>
            <Text className='dash-section-title'>今日菜单概览</Text>
            <Text className='dash-section-link' onClick={() => openPage('/pages/menu-plan/index')}>
              查看菜单
            </Text>
          </View>
          <ScrollView scrollX>
            <View className='dash-menu-scroll'>
              {groupedMenu.map((group) => (
                <View key={group.mealType} className='dash-meal-block'>
                  <Text className='dash-meal-label'>{formatMealType(group.mealType)}</Text>
                  {group.groups.map((cat) => (
                    <View key={cat.category} className='dash-category-group'>
                      <Text className='dash-category-label'>{cat.category}</Text>
                      {cat.dishes.map((dish) => (
                        <View key={dish.id} className='dash-dish-item'>
                          <Text className='dash-dish-name'>{dish.name}</Text>
                          <Text className='dash-dish-station'>{dish.station}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      {!busy && groupedMenu.length === 0 && !message ? (
        <View className='dash-empty'>
          <Text className='dash-empty-title'>今天还没有菜单</Text>
          <Text className='dash-empty-text'>请先进入菜单页面安排今日菜品。</Text>
        </View>
      ) : null}

      {!busy && pendingTasks.length > 0 ? (
        <View className='dash-section'>
          <View className='dash-section-header'>
            <Text className='dash-section-title'>待办任务</Text>
            <Text className='dash-task-count'>{pendingTasks.length} 项</Text>
          </View>
          <View className='dash-task-list'>
            {pendingTasks.slice(0, 5).map((task) => (
              <View key={task.id} className='dash-task-card'>
                <View className='dash-task-info'>
                  <Text className='dash-task-title'>{task.title || '未命名任务'}</Text>
                  <Text className='dash-task-meal'>{formatMealType(task.mealType)}</Text>
                </View>
                <View className={`dash-task-status dash-task-status--${task.status}`}>
                  <Text className='dash-task-status-text'>{formatTaskStatus(task.status)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className='dash-signout'>
        <Text className='dash-signout-link' onClick={handleSignOut}>
          退出登录
        </Text>
      </View>

      <TabBar current='index' />
    </View>
  );
}
