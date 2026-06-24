import { Image, Text, View } from '@tarojs/components';
import { Button as NutButton } from '@nutui/nutui-react-taro';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { fetchDish, type DishDetail } from '../../api/dish';
import { clearSession, hasSession } from '../../utils/session';
import './index.scss';

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function createEmptyDish(dishId?: string): DishDetail {
  return {
    id: dishId || 'unavailable',
    name: dishId ? '暂无详情' : '未选择菜品',
    category: '未分类',
    station: '通用工位',
    description: '',
    coverImageUrl: '',
    ingredientCost: 0,
    isActive: false,
    ingredients: [],
    steps: [],
    updatedAt: '',
  };
}

function formatCurrency(value?: number, digits = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return value.toFixed(digits);
}

export default function DishDetailPage() {
  const router = useRouter();
  const dishId = router.params.id || '';
  const [dish, setDish] = useState<DishDetail>(() => createEmptyDish(dishId));
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    void loadDish();
  }, [dishId]);

  async function loadDish() {
    setBusy(true);
    setMessage('');

    if (!dishId) {
      setDish(createEmptyDish());
      setMessage('未选择菜品');
      setBusy(false);
      return;
    }

    try {
      const data = await fetchDish(dishId);
      setDish(data);
    } catch (error) {
      setDish(createEmptyDish(dishId));
      setMessage(error instanceof Error ? error.message : '菜品详情加载失败。');
    } finally {
      setBusy(false);
    }
  }

  function handleBack() {
    Taro.navigateBack({ fail: () => Taro.reLaunch({ url: '/pages/dishes/index' }) });
  }

  function handleOpenMyPage() {
    Taro.reLaunch({ url: '/pages/my/index' });
  }

  function handleSignOut() {
    clearSession();
    redirectToLogin();
  }

  return (
    <View className='screen detail-screen'>
      <View className='shell-card detail-header'>
        <View className='detail-header-top'>
          <View>
            <Text className='detail-title'>{dish.name}</Text>
            <Text className='detail-subtitle'>
              {dish.category} | {dish.station}
            </Text>
          </View>
          <Text className='detail-chip'>{dish.isActive === false ? '停用' : '启用'}</Text>
        </View>

        {dish.coverImageUrl ? (
          <Image className='detail-cover-image' src={dish.coverImageUrl} mode='aspectFill' />
        ) : (
          <View className='detail-cover-placeholder'>
                  <Text className='detail-cover-placeholder-title'>暂无封面</Text>
          </View>
        )}

        {dish.description ? <Text className='detail-description'>{dish.description}</Text> : null}
        {message ? <Text className='detail-message'>{message}</Text> : null}
        {busy ? <Text className='detail-loading'>正在加载菜品详情...</Text> : null}
      </View>

      <View className='detail-action-row'>
        <NutButton size='mini' onClick={handleBack}>
          返回列表
        </NutButton>
        <NutButton size='mini' onClick={handleOpenMyPage}>
          个人中心
        </NutButton>
        <NutButton size='mini' onClick={handleSignOut}>
          退出登录
        </NutButton>
      </View>

      <View className='detail-kpis'>
        <View className='shell-card detail-kpi'>
          <Text className='detail-kpi-label'>食材成本</Text>
          <Text className='detail-kpi-value'>{formatCurrency(dish.ingredientCost, 1)}</Text>
        </View>
      </View>

      <View className='shell-card detail-section'>
        <Text className='detail-section-title'>食材清单</Text>
        {dish.ingredients.length > 0 ? (
          dish.ingredients.map((item) => (
            <View key={`${item.ingredientId}-${item.unit}`} className='detail-row'>
              <Text>{item.ingredientId}</Text>
              <Text>
                {item.quantity}
                {item.unit} | 损耗 {Math.round(item.wasteRate * 100)}%
              </Text>
            </View>
          ))
        ) : (
          <Text className='detail-empty'>当前还没有配置食材。</Text>
        )}
      </View>

      <View className='shell-card detail-section'>
        <Text className='detail-section-title'>标准步骤</Text>
        {dish.steps.length > 0 ? (
          dish.steps.map((step) => (
            <View key={step.id} className='detail-step'>
              <Text className='detail-step-title'>
                第 {step.id} 步：{step.title}
              </Text>
              <Text className='detail-step-body'>{step.description}</Text>
              <Text className='detail-step-meta'>
                {step.station || '通用工位'} | {step.duration || 0} 分钟
              </Text>
            </View>
          ))
        ) : (
          <Text className='detail-empty'>当前还没有配置标准步骤。</Text>
        )}
      </View>
    </View>
  );
}
