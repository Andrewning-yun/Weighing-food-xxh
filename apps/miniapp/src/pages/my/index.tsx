import { Text, View } from '@tarojs/components';
import { Button as NutButton } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import TabBar from '../../components/TabBar';
import { me } from '../../api/auth';
import {
  clearSession,
  formatRoleLabel,
  getActiveStoreName,
  getSessionUser,
  hasSession,
  setSessionUser,
  toSessionUser,
} from '../../utils/session';
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

type Shortcut = {
  name: string;
  url: string;
  visible: (role: Role) => boolean;
};

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

export default function MyPage() {
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(getSessionUser());

  const role = (profile?.role || '') as Role;
  const storeName = getActiveStoreName(profile) || profile?.storeName || profile?.storeId || '未绑定门店';

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    void loadProfile();
  }, []);

  async function loadProfile() {
    setBusy(true);
    setMessage('');

    try {
      const data = await me();
      const sessionUser = toSessionUser(data);
      setSessionUser(sessionUser);
      setProfile(sessionUser);
    } catch (error) {
      setProfile(getSessionUser());
      setMessage(error instanceof Error ? error.message : '刷新失败');
    } finally {
      setBusy(false);
    }
  }

  function openPage(url: string) {
    Taro.navigateTo({ url }).catch(() => {
      Taro.reLaunch({ url });
    });
  }

  function handleSignOut() {
    clearSession();
    redirectToLogin();
  }

  const shortcuts = useMemo<Shortcut[]>(
    () =>
      [
        { name: '门店管理', url: '/pages/store-manage/index', visible: (nextRole) => nextRole === 'admin' },
        {
          name: '员工管理',
          url: '/pages/staff-manage/index',
          visible: (nextRole) => nextRole === 'admin' || nextRole === 'chef_manager',
        },
        {
          name: '算法配置',
          url: '/pages/algorithm-config/index',
          visible: (nextRole) => ['admin', 'chef_manager', 'buyer'].includes(nextRole),
        },
        {
          name: '菜单标准',
          url: '/pages/menu-standard/index',
          visible: (nextRole) => ['admin', 'chef_manager', 'store_manager'].includes(nextRole),
        },
        {
          name: '审核管理',
          url: '/pages/audit/index',
          visible: (nextRole) => ['admin', 'store_manager', 'buyer'].includes(nextRole),
        },
        { name: '数据导入', url: '/pages/data-import/index', visible: (nextRole) => nextRole === 'admin' },
        {
          name: '操作日志',
          url: '/pages/operation-log/index',
          visible: (nextRole) => nextRole === 'admin' || nextRole === 'store_manager',
        },
      ].filter((item) => item.visible(role)),
    [role],
  );

  return (
    <View className='screen my-screen'>
      <View className='my-profile-header'>
        <View className='my-avatar-wrap'>
          <View className='my-avatar'>我的</View>
        </View>
        <View className='my-header-info'>
          <Text className='my-title'>{profile?.displayName || profile?.name || '当前用户'}</Text>
          <Text className='my-role-tag'>{formatRoleLabel(profile?.role)}</Text>
          <Text className='my-subtitle'>{storeName}</Text>
        </View>
      </View>

      <View className='shell-card my-section'>
        <Text className='my-section-title'>账户信息</Text>
        <View className='my-profile-row'>
          <Text className='my-profile-label'>用户名</Text>
          <Text className='my-profile-value'>{profile?.username || '-'}</Text>
        </View>
        <View className='my-profile-row'>
          <Text className='my-profile-label'>姓名</Text>
          <Text className='my-profile-value'>{profile?.displayName || profile?.name || '未知用户'}</Text>
        </View>
        <View className='my-profile-row'>
          <Text className='my-profile-label'>角色</Text>
          <Text className='my-profile-value'>{formatRoleLabel(profile?.role)}</Text>
        </View>
        <View className='my-profile-row'>
          <Text className='my-profile-label'>当前门店</Text>
          <Text className='my-profile-value'>{storeName}</Text>
        </View>
        {message ? <Text className='my-message'>{message}</Text> : null}
        {busy ? <Text className='my-hint'>正在刷新...</Text> : null}
      </View>

      <View className='shell-card my-section'>
        <Text className='my-section-title'>功能入口</Text>
        <View className='my-shortcut-list'>
          {shortcuts.map((item) => (
            <View key={item.url} className='my-shortcut-item' onClick={() => openPage(item.url)}>
              <View className='my-shortcut-info'>
                <Text className='my-shortcut-name'>{item.name}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className='my-actions'>
        <NutButton size='mini' onClick={loadProfile}>
          刷新
        </NutButton>
        <NutButton size='mini' onClick={handleSignOut}>
          退出
        </NutButton>
      </View>

      <TabBar current='my' />
    </View>
  );
}
