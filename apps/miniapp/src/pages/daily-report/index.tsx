import { Picker, Text, Textarea, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import {
  createDailyMetric,
  createDishFeedback,
  fetchDailyMetrics,
  fetchDishFeedback,
  updateDailyMetric,
  updateDishFeedback,
  type DailyMetricRecord,
  type DishFeedbackRecord,
  type LeftoverLevel,
  type MealType,
} from '../../api/daily-report';
import { fetchDishes, type DishSummary } from '../../api/dish';
import { fetchMenuPlans, type MenuPlan } from '../../api/menu-plan';
import { getTodayDateStr, getWeekdayLabel } from '../../utils/date';
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

interface MetricForm {
  avgTicketPrice: string;
  customerCount: string;
  totalRevenue: string;
  weather: string;
}

interface FeedbackItem {
  dishId: string;
  dishName: string;
  category: string;
  station: string;
  leftoverLevel: LeftoverLevel;
  note: string;
  id?: string;
}

const leftoverOptions: Array<{ value: LeftoverLevel; label: string }> = [
  { value: 'none', label: '无剩余' },
  { value: 'low', label: '较少' },
  { value: 'medium', label: '中等' },
  { value: 'high', label: '较多' },
];

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function formatMealType(mealType: MealType): string {
  return mealType === 'breakfast' ? '早餐' : '正餐';
}

function createEmptyMetricForm(): MetricForm {
  return {
    avgTicketPrice: '',
    customerCount: '',
    totalRevenue: '',
    weather: '',
  };
}

function toNumber(value: string): number | undefined {
  const next = value.trim();
  if (!next) return undefined;
  const parsed = Number(next);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function DailyReportPage() {
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [mealTab, setMealTab] = useState<MealType>('breakfast');
  const [metricId, setMetricId] = useState('');
  const [metricForm, setMetricForm] = useState<MetricForm>(createEmptyMetricForm());
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [reportStatus, setReportStatus] = useState<'empty' | 'filled'>('empty');

  const user = getSessionUser();
  const role = (user?.role || '') as Role;
  const storeId = user?.storeId || '';
  const canEdit = role === 'admin' || role === 'store_manager';

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    if (!canEdit) {
      setBusy(false);
      setMessage('当前角色无权访问每日日报。');
      return;
    }

    void loadData();
  }, [selectedDate, mealTab]);

  async function loadData() {
    setBusy(true);
    setMessage('');

    try {
      const [allDishes, planList, metricList, feedbackList] = await Promise.all([
        fetchDishes().catch(() => [] as DishSummary[]),
        fetchMenuPlans({ storeId, date: selectedDate, mealType: mealTab }).catch(() => [] as MenuPlan[]),
        fetchDailyMetrics({ storeId, date: selectedDate, mealType: mealTab }).catch(
          () => [] as DailyMetricRecord[],
        ),
        fetchDishFeedback({ storeId, date: selectedDate, mealType: mealTab }).catch(
          () => [] as DishFeedbackRecord[],
        ),
      ]);

      const currentPlan = planList[0] || null;
      const dishPool = currentPlan?.dishes?.length
        ? currentPlan.dishes
            .map((planDish) => allDishes.find((dish) => dish.id === planDish.dishId))
            .filter((dish): dish is DishSummary => Boolean(dish))
        : allDishes.filter((dish) => dish.isActive !== false);

      const metric = metricList[0] || null;
      if (metric) {
        setMetricId(metric.id);
        setMetricForm({
          avgTicketPrice: String(metric.avgTicketPrice ?? ''),
          customerCount: String(metric.customerCount ?? ''),
          totalRevenue: metric.totalRevenue === undefined ? '' : String(metric.totalRevenue),
          weather: metric.weather || '',
        });
      } else {
        setMetricId('');
        setMetricForm(createEmptyMetricForm());
      }

      const feedbackMap = new Map(feedbackList.map((item) => [item.dishId, item]));
      setFeedbackItems(
        dishPool.slice(0, 12).map((dish) => {
          const existing = feedbackMap.get(dish.id);
          return {
            dishId: dish.id,
            dishName: dish.name,
            category: dish.category,
            station: dish.station,
            leftoverLevel: existing?.leftoverLevel || 'none',
            note: existing?.note || '',
            id: existing?.id,
          };
        }),
      );

      setReportStatus(metric || feedbackList.length > 0 ? 'filled' : 'empty');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '日报数据加载失败。');
      setReportStatus('empty');
    } finally {
      setBusy(false);
    }
  }

  const feedbackCount = useMemo(() => feedbackItems.length, [feedbackItems]);

  function handleMetricChange(field: keyof MetricForm, value: string) {
    setMetricForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFeedbackChange(index: number, patch: Partial<FeedbackItem>) {
    setFeedbackItems((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setMessage('');

    try {
      const payload = {
        storeId,
        date: selectedDate,
        mealType: mealTab,
        avgTicketPrice: toNumber(metricForm.avgTicketPrice) || 0,
        customerCount: Math.floor(toNumber(metricForm.customerCount) || 0),
        totalRevenue: toNumber(metricForm.totalRevenue),
        weather: metricForm.weather.trim() || undefined,
      };

      if (metricId) {
        await updateDailyMetric(metricId, payload);
      } else {
        await createDailyMetric(payload);
      }

      for (const item of feedbackItems) {
        const feedbackPayload = {
          storeId,
          date: selectedDate,
          mealType: mealTab,
          dishId: item.dishId,
          leftoverLevel: item.leftoverLevel,
          note: item.note.trim() || undefined,
        };

        if (item.id) {
          await updateDishFeedback(item.id, feedbackPayload);
        } else {
          await createDishFeedback(feedbackPayload);
        }
      }

      Taro.showToast({ title: '已保存', icon: 'success' });
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '日报保存失败。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className='screen daily-report-screen'>
      <View className='dr-hero shell-card'>
        <View>
          <Text className='dr-eyebrow'>经营日报</Text>
          <Text className='dr-title'>每日日报</Text>
          <Text className='dr-subtitle'>
            {user?.storeName || user?.storeId || '未绑定门店'} | {reportStatus === 'filled' ? '已填报' : '未填报'}
          </Text>
        </View>
        <View className='dr-role'>
          <Text className='dr-role-text'>{formatRoleLabel(role)}</Text>
        </View>
      </View>

      <View className='shell-card dr-toolbar'>
        <Picker mode='date' value={selectedDate} onChange={(event) => setSelectedDate(event.detail.value)}>
          <View className='dr-date-picker'>
            <Text className='dr-date-label'>{selectedDate}</Text>
            <Text className='dr-date-weekday'>{getWeekdayLabel(selectedDate)}</Text>
          </View>
        </Picker>

        <View className='dr-tabs'>
          <View className={`dr-tab ${mealTab === 'breakfast' ? 'dr-tab-active' : ''}`} onClick={() => setMealTab('breakfast')}>
            <Text className='dr-tab-text'>早餐</Text>
          </View>
          <View className={`dr-tab ${mealTab === 'lunch' ? 'dr-tab-active' : ''}`} onClick={() => setMealTab('lunch')}>
            <Text className='dr-tab-text'>正餐</Text>
          </View>
        </View>
      </View>

      {message ? <Text className='dr-message'>{message}</Text> : null}

      {busy ? (
        <View className='dr-loading'>
          <Text className='dr-loading-text'>正在加载日报数据...</Text>
        </View>
      ) : null}

      {!busy ? (
        <View className='shell-card dr-card'>
          <View className='dr-card-header'>
            <Text className='dr-card-title'>{formatMealType(mealTab)}经营数据</Text>
            <Text className='dr-card-badge'>{reportStatus === 'filled' ? '已填报' : '未填报'}</Text>
          </View>

          <View className='dr-field-grid'>
            <View className='dr-field'>
              <Text className='dr-field-label'>平均客单价</Text>
              <NutInput
                className='dr-input'
                type='number'
                value={metricForm.avgTicketPrice}
                placeholder='例如 32.5'
                onChange={(v) => handleMetricChange('avgTicketPrice', v)}
              />
            </View>
            <View className='dr-field'>
              <Text className='dr-field-label'>就餐人数</Text>
              <NutInput
                className='dr-input'
                type='number'
                value={metricForm.customerCount}
                placeholder='例如 280'
                onChange={(v) => handleMetricChange('customerCount', v)}
              />
            </View>
            <View className='dr-field'>
              <Text className='dr-field-label'>总营业额</Text>
              <NutInput
                className='dr-input'
                type='number'
                value={metricForm.totalRevenue}
                placeholder='可选填写'
                onChange={(v) => handleMetricChange('totalRevenue', v)}
              />
            </View>
            <View className='dr-field'>
              <Text className='dr-field-label'>天气</Text>
              <NutInput
                className='dr-input'
                value={metricForm.weather}
                placeholder='晴天 / 多云 / 雨天'
                onChange={(v) => handleMetricChange('weather', v)}
              />
            </View>
          </View>
        </View>
      ) : null}

      {!busy ? (
        <View className='shell-card dr-card'>
          <View className='dr-card-header'>
            <Text className='dr-card-title'>菜品剩余反馈</Text>
            <Text className='dr-card-badge'>{feedbackCount} 项</Text>
          </View>
          <Text className='dr-tip'>系统会根据剩余反馈调整后续推荐，请优先填写重点菜品。</Text>

          <View className='dr-feedback-list'>
            {feedbackItems.map((item, index) => (
              <View key={item.dishId} className='dr-feedback-item'>
                <View className='dr-feedback-main'>
                  <View className='dr-feedback-info'>
                    <Text className='dr-feedback-name'>{item.dishName}</Text>
                    <Text className='dr-feedback-meta'>
                      {item.category} | {item.station}
                    </Text>
                  </View>
                  <Picker
                    mode='selector'
                    range={leftoverOptions.map((option) => option.label)}
                    value={leftoverOptions.findIndex((option) => option.value === item.leftoverLevel)}
                    onChange={(event) => {
                      const next = leftoverOptions[event.detail.value]?.value || 'none';
                      handleFeedbackChange(index, { leftoverLevel: next });
                    }}
                  >
                    <View className='dr-select-chip'>
                      <Text className='dr-select-chip-text'>
                        {leftoverOptions.find((option) => option.value === item.leftoverLevel)?.label || '无剩余'}
                      </Text>
                    </View>
                  </Picker>
                </View>
                <Textarea
                  className='dr-textarea'
                  value={item.note}
                  placeholder='可选备注'
                  onInput={(event) => handleFeedbackChange(index, { note: event.detail.value })}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {!busy ? (
        <View className='shell-card dr-summary'>
          <Text className='dr-summary-text'>
            已加载 {feedbackItems.length} 道菜用于反馈。保存时会同时写入经营数据和剩余反馈。
          </Text>
        </View>
      ) : null}

      <View className='dr-actions'>
        <NutButton type='primary' loading={submitting} onClick={handleSubmit}>
          保存
        </NutButton>
        <NutButton onClick={() => Taro.reLaunch({ url: '/pages/my/index' })}>返回个人中心</NutButton>
      </View>
    </View>
  );
}
