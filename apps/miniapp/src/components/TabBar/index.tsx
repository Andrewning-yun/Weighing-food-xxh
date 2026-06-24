import { Text } from '@tarojs/components';
import { Tabbar, TabbarItem } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { canAccessPage } from '../../utils/role-guard';
import { getSessionUser } from '../../utils/session';

type TabKey = 'index' | 'menu-plan' | 'tasks' | 'my';
type PageName = 'index' | 'menu-plan' | 'tasks' | 'my';

const TABS: Array<{ key: TabKey; label: string; url: string; pageName: PageName }> = [
  { key: 'index', label: '首页', url: '/pages/index/index', pageName: 'index' },
  { key: 'menu-plan', label: '菜单', url: '/pages/menu-plan/index', pageName: 'menu-plan' },
  { key: 'tasks', label: '任务', url: '/pages/tasks/index', pageName: 'tasks' },
  { key: 'my', label: '我的', url: '/pages/my/index', pageName: 'my' },
];

const KEY_TO_INDEX: Record<TabKey, number> = { index: 0, 'menu-plan': 1, tasks: 2, my: 3 };
const INDEX_TO_KEY: Record<number, TabKey> = { 0: 'index', 1: 'menu-plan', 2: 'tasks', 3: 'my' };

export function TabBar(props: { current: TabKey }) {
  const user = getSessionUser();
  const role = user?.role as
    | 'admin' | 'chef_manager' | 'chef' | 'prep'
    | 'breakfast_chef' | 'breakfast_assistant' | 'buyer' | 'store_manager'
    | undefined;

  function handleSwitch(value: number) {
    const key = INDEX_TO_KEY[value];
    if (key === undefined) return;
    const tab = TABS[value];
    if (!tab) return;

    if (key === props.current) return;

    if (role && tab.pageName !== 'my' && !canAccessPage(role, tab.pageName)) {
      Taro.showToast({ title: '当前角色无权进入', icon: 'none' });
      return;
    }

    Taro.reLaunch({ url: tab.url });
  }

  const activeValue = KEY_TO_INDEX[props.current] ?? 0;

  return (
    <Tabbar
      fixed
      activeColor="#E8530E"
      inactiveColor="#8a6f5d"
      safeArea
      value={activeValue}
      onSwitch={handleSwitch}
    >
      {TABS.map((tab) => (
        <TabbarItem key={tab.key} title={<Text>{tab.label}</Text>} />
      ))}
    </Tabbar>
  );
}

export default TabBar;
