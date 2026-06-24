import { ScrollView, Text, View } from '@tarojs/components';
import { Button as NutButton } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchCategoryDistribution,
  fetchDishFrequency,
  fetchIngredientUsage,
  fetchProfitDistribution,
  type AnalysisMealType,
} from '../../api/analysis';
import { getActiveStoreId, getActiveStoreName, getSessionUser, hasSession } from '../../utils/session';
import './index.scss';

type AnalysisTab = 'overview' | 'ingredient' | 'dish' | 'profit';

const TAB_ITEMS: Array<{ key: AnalysisTab; label: string }> = [
  { key: 'overview', label: '总览' },
  { key: 'ingredient', label: '食材排行' },
  { key: 'dish', label: '菜品排行' },
  { key: 'profit', label: '毛利分析' },
];

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function AnalysisPage() {
  const user = getSessionUser();
  const storeId = getActiveStoreId(user);
  const storeName = getActiveStoreName(user) || user?.storeName || user?.storeId || '未绑定门店';

  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<AnalysisTab>('overview');
  const [mealType, setMealType] = useState<AnalysisMealType>('lunch');
  const [startDate] = useState(daysAgo(6));
  const [endDate] = useState(today());
  const [ingredientUsage, setIngredientUsage] = useState<any>(null);
  const [dishFrequency, setDishFrequency] = useState<any>(null);
  const [profitDistribution, setProfitDistribution] = useState<any>(null);
  const [categoryDistribution, setCategoryDistribution] = useState<any>(null);

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }
    void bootstrap();
  }, [storeId, mealType]);

  async function bootstrap() {
    if (!storeId) {
      setBusy(false);
      setMessage('当前未选择门店，暂时无法加载分析数据。');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const query = { storeId, startDate, endDate, mealType };
      const [ingredientData, dishData, profitData, categoryData] = await Promise.all([
        fetchIngredientUsage(query),
        fetchDishFrequency(query),
        fetchProfitDistribution(query),
        fetchCategoryDistribution(query),
      ]);
      setIngredientUsage(ingredientData);
      setDishFrequency(dishData);
      setProfitDistribution(profitData);
      setCategoryDistribution(categoryData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载分析数据失败');
    } finally {
      setBusy(false);
    }
  }

  const overviewCards = useMemo(
    () => [
      { label: '分类数', value: categoryDistribution?.summary?.categoryCount ?? 0 },
      { label: '菜品数', value: dishFrequency?.summary?.dishCount ?? 0 },
      { label: '食材数', value: ingredientUsage?.summary?.ingredientCount ?? 0 },
      { label: '平均毛利', value: profitDistribution?.summary?.averageGrossMargin ?? 0 },
    ],
    [categoryDistribution, dishFrequency, ingredientUsage, profitDistribution],
  );

  return (
    <View className='analysis-v2-page'>
      <View className='shell-card an2-hero'>
        <View>
          <Text className='an2-eyebrow'>数据分析</Text>
          <Text className='an2-title'>分析中心</Text>
          <Text className='an2-subtitle'>{storeName}</Text>
        </View>
        <NutButton size='mini' onClick={bootstrap} loading={busy}>
          刷新
        </NutButton>
      </View>

      <View className='an2-filter-row'>
        <View className='an2-chip-row'>
          <Text className={`an2-tab ${mealType === 'breakfast' ? 'an2-tab-active' : ''}`} onClick={() => setMealType('breakfast')}>
            早餐
          </Text>
          <Text className={`an2-tab ${mealType === 'lunch' ? 'an2-tab-active' : ''}`} onClick={() => setMealType('lunch')}>
            正餐
          </Text>
        </View>
        <Text className='an2-date-range'>
          {startDate} 至 {endDate}
        </Text>
      </View>

      <ScrollView scrollX className='an2-tab-scroll'>
        <View className='an2-tab-row'>
          {TAB_ITEMS.map((item) => (
            <Text key={item.key} className={`an2-tab ${tab === item.key ? 'an2-tab-active' : ''}`} onClick={() => setTab(item.key)}>
              {item.label}
            </Text>
          ))}
        </View>
      </ScrollView>

      {message ? <Text className='an2-message'>{message}</Text> : null}
      {busy ? <View className='shell-card an2-loading'>正在整理分析数据...</View> : null}

      {!busy && tab === 'overview' ? (
        <View className='an2-blocks'>
          <View className='an2-kpis'>
            {overviewCards.map((item) => (
              <View key={item.label} className='shell-card an2-kpi'>
                <Text className='an2-kpi-value'>{item.value}</Text>
                <Text className='an2-kpi-label'>{item.label}</Text>
              </View>
            ))}
          </View>

          <View className='shell-card an2-placeholder'>
            <Text className='an2-placeholder-title'>分类分布</Text>
            {(categoryDistribution?.items || []).map((item: any) => (
              <View key={item.category} className='an2-list-row'>
                <Text className='an2-row-title'>{item.category}</Text>
                <Text className='an2-row-meta'>
                  {item.count} 道 · {item.ratio}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {!busy && tab === 'ingredient' ? (
        <View className='shell-card an2-placeholder'>
          <Text className='an2-placeholder-title'>食材使用排行</Text>
          {(ingredientUsage?.items || []).slice(0, 12).map((item: any) => (
            <View key={item.ingredientId} className='an2-list-row'>
              <Text className='an2-row-title'>
                {item.rank}. {item.ingredientName}
              </Text>
              <Text className='an2-row-meta'>
                {item.totalQuantity} {item.unit} · {item.category}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {!busy && tab === 'dish' ? (
        <View className='shell-card an2-placeholder'>
          <Text className='an2-placeholder-title'>菜品出现频次</Text>
          {(dishFrequency?.items || []).slice(0, 12).map((item: any) => (
            <View key={item.dishId} className='an2-list-row'>
              <Text className='an2-row-title'>
                {item.rank}. {item.dishName}
              </Text>
              <Text className='an2-row-meta'>
                {item.frequency} 次 · {item.category}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {!busy && tab === 'profit' ? (
        <View className='shell-card an2-placeholder'>
          <Text className='an2-placeholder-title'>毛利分布</Text>
          {(profitDistribution?.items || []).map((item: any) => (
            <View key={item.key} className='an2-list-row'>
              <Text className='an2-row-title'>{item.label}</Text>
              <Text className='an2-row-meta'>{item.count} 道</Text>
            </View>
          ))}
          <Text className='an2-placeholder-title'>高毛利菜品</Text>
          {(profitDistribution?.dishes || []).slice(0, 8).map((item: any) => (
            <View key={item.dishId} className='an2-list-row'>
              <Text className='an2-row-title'>{item.dishName}</Text>
              <Text className='an2-row-meta'>毛利 {Number(item.estimatedMargin * 100).toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
