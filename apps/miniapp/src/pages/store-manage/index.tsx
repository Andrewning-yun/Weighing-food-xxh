import { Text, View } from '@tarojs/components';
import { Button as NutButton } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import request from '../../api/request';
import {
  getActiveStoreId,
  getActiveStoreName,
  getSessionUser,
  hasSession,
  setActiveStore,
} from '../../utils/session';
import './index.scss';

interface StoreRecord {
  id: string;
  name: string;
  address?: string;
  brandId?: string;
  chefCount?: number;
  dailyCustomers?: number;
  targetTicketPriceBreakfast?: number | null;
  targetTicketPriceLunch?: number | null;
  pricePerLiang?: number | null;
  memberPricePerLiang?: number | null;
  ricePrice?: number | null;
  isActive?: boolean;
  contactName?: string;
  contactPhone?: string;
}

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

async function fetchStores() {
  return request<StoreRecord[]>({
    url: '/stores',
    auth: true,
  });
}

function toPriceText(value?: number | null) {
  return value === null || value === undefined ? '--' : String(value);
}

export default function StoreManagePage() {
  const user = getSessionUser();
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [expandedId, setExpandedId] = useState('');
  const [activeStoreId, setActiveStoreId] = useState(getActiveStoreId(user));

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
      const data = await fetchStores();
      setStores(data);
      if (!expandedId && data.length > 0) {
        setExpandedId(activeStoreId || data[0].id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载门店列表失败');
    } finally {
      setBusy(false);
    }
  }

  function switchStore(record: StoreRecord) {
    setActiveStore(record.id, record.name);
    setActiveStoreId(record.id);
    Taro.showToast({ title: `已切换到${record.name}`, icon: 'success' });
  }

  const activeStoreName = getActiveStoreName(user) || stores.find((item) => item.id === activeStoreId)?.name || '未选择门店';
  const visibleStores = useMemo(() => stores.filter((item) => item.isActive !== false), [stores]);

  return (
    <View className='store-v2-page'>
      <View className='shell-card sm2-hero'>
        <View>
          <Text className='sm2-eyebrow'>门店中心</Text>
          <Text className='sm2-title'>门店管理</Text>
          <Text className='sm2-subtitle'>当前门店：{activeStoreName}</Text>
        </View>
        <NutButton size='mini' onClick={bootstrap} loading={busy}>
          刷新
        </NutButton>
      </View>

      {message ? <Text className='sm2-message'>{message}</Text> : null}

      {busy ? <View className='shell-card sm2-loading'>正在加载门店...</View> : null}

      {!busy && visibleStores.length === 0 ? (
        <View className='shell-card sm2-empty'>当前没有可用门店。</View>
      ) : null}

      {!busy ? (
        <View className='sm2-list'>
          {visibleStores.map((store) => {
            const expanded = expandedId === store.id;
            const current = activeStoreId === store.id;

            return (
              <View key={store.id} className='shell-card sm2-card'>
                <View className='sm2-card-head' onClick={() => setExpandedId(expanded ? '' : store.id)}>
                  <View>
                    <Text className='sm2-card-name'>{store.name}</Text>
                    <Text className='sm2-card-meta'>{store.brandId || '未填写品牌编号'}</Text>
                  </View>
                  <Text className={`sm2-status ${current ? 'sm2-status-active' : ''}`}>{current ? '当前门店' : '查看详情'}</Text>
                </View>

                {expanded ? (
                  <View className='sm2-detail'>
                    <View className='sm2-grid'>
                      <View>
                        <Text className='sm2-label'>门店地址</Text>
                        <Text className='sm2-value'>{store.address || '未填写'}</Text>
                      </View>
                      <View>
                        <Text className='sm2-label'>联系方式</Text>
                        <Text className='sm2-value'>{store.contactName || '未填写'} {store.contactPhone || ''}</Text>
                      </View>
                      <View>
                        <Text className='sm2-label'>早餐客单价</Text>
                        <Text className='sm2-value'>{toPriceText(store.targetTicketPriceBreakfast)}</Text>
                      </View>
                      <View>
                        <Text className='sm2-label'>正餐客单价</Text>
                        <Text className='sm2-value'>{toPriceText(store.targetTicketPriceLunch)}</Text>
                      </View>
                      <View>
                        <Text className='sm2-label'>两价 / 会员两价</Text>
                        <Text className='sm2-value'>{toPriceText(store.pricePerLiang)} / {toPriceText(store.memberPricePerLiang)}</Text>
                      </View>
                      <View>
                        <Text className='sm2-label'>米饭价格</Text>
                        <Text className='sm2-value'>{toPriceText(store.ricePrice)}</Text>
                      </View>
                      <View>
                        <Text className='sm2-label'>厨师人数</Text>
                        <Text className='sm2-value'>{store.chefCount ?? '--'}</Text>
                      </View>
                      <View>
                        <Text className='sm2-label'>日均客流</Text>
                        <Text className='sm2-value'>{store.dailyCustomers ?? '--'}</Text>
                      </View>
                    </View>

                    <View className='sm2-placeholder'>
                      <Text className='sm2-placeholder-title'>运营统计</Text>
                      <Text className='sm2-placeholder-copy'>这里先保留门店运营概览骨架，后续再接真实统计。</Text>
                    </View>

                    <View className='sm2-actions'>
                      {!current ? (
                        <NutButton size='mini' type='primary' onClick={() => switchStore(store)}>
                          切换到此门店
                        </NutButton>
                      ) : (
                        <Text className='sm2-current-hint'>当前已在此门店下工作</Text>
                      )}
                      <NutButton size='mini' onClick={() => Taro.navigateTo({ url: '/pages/menu-standard/index' })}>
                        菜单标准
                      </NutButton>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
