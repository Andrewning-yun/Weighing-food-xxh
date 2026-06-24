import { type ReactNode, useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Layout from 'tdesign-react/es/layout';
import Menu from 'tdesign-react/es/menu';
import { Button } from 'tdesign-react/es/button';
import { LogoutIcon, MenuFoldIcon, MenuUnfoldIcon } from 'tdesign-icons-react';
import { GROUP_LABELS, GROUP_ORDER, getRoutesByGroup, ROUTES, canAccessRoute } from '../lib/routes';
import { useAppStore } from '../lib/store';
import { clearToken } from '../lib/api';

const { Aside, Content, Header } = Layout;
const { MenuItem, MenuGroup } = Menu;

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: '管理员',
    chef_manager: '厨房主管',
    chef: '厨师',
    prep: '备料',
    breakfast_chef: '早餐主厨',
    breakfast_assistant: '早餐帮工',
    buyer: '采购',
    store_manager: '门店经理',
  };
  return labels[role] || role;
}

export function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const user = useAppStore((state) => state.user);
  const [hoverOpen, setHoverOpen] = useState(false);

  const isExpanded = sidebarOpen || hoverOpen;
  const sidebarWidth = isExpanded ? 240 : 64;

  const routes = useMemo(
    () => ROUTES.filter((r) => canAccessRoute(user, r)),
    [user],
  );

  const handleMenuChange = useCallback(
    (value: string | number) => {
      const path = typeof value === 'string' ? value : String(value);
      if (path) router.push(path);
    },
    [router],
  );

  const visibleGroups = GROUP_ORDER.filter((group) => {
    const groupRoutes = getRoutesByGroup(group);
    return groupRoutes.some((r) => routes.some((available) => available.path === r.path));
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Aside
        style={{
          width: sidebarWidth,
          background: 'var(--td-bg-color-container)',
          transition: 'width 200ms ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--td-component-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: sidebarWidth,
          }}
          onMouseEnter={() => setHoverOpen(true)}
          onMouseLeave={() => setHoverOpen(false)}
        >
        {/* Brand Header */}
        <div
          style={{
            padding: isExpanded ? '20px 20px 12px' : '16px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: isExpanded ? '10px' : '0',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            borderBottom: '1px solid var(--td-component-border)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--td-brand-color)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            快
          </span>
          {isExpanded && (
            <span style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              快餐厨房
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          <Menu
            value={pathname}
            onChange={handleMenuChange}
            style={{ background: 'transparent' }}
            collapsed={!isExpanded}
          >
            {visibleGroups.map((group) => {
              const groupRoutes = getRoutesByGroup(group).filter((r) =>
                routes.some((available) => available.path === r.path),
              );

              return (
                <MenuGroup key={group} title={isExpanded ? GROUP_LABELS[group] : ''}>
                  {groupRoutes.map((route) => (
                    <MenuItem key={route.path} value={route.path} icon={route.icon}>
                      {route.name}
                    </MenuItem>
                  ))}
                </MenuGroup>
              );
            })}
          </Menu>
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: isExpanded ? '12px 16px' : '8px',
            borderTop: '1px solid var(--td-component-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {isExpanded && (
            <>
              {user && (
                <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600 }}>{user.displayName}</div>
                  <div style={{ color: 'var(--td-text-color-secondary)', fontSize: '0.72rem' }}>
                    {getRoleLabel(user.role)}
                  </div>
                </div>
              )}
              <Button
                variant="text"
                size="small"
                icon={<LogoutIcon />}
                onClick={() => { clearToken(); router.push('/login'); }}
                style={{ justifyContent: 'flex-start' }}
              >
                退出登录
              </Button>
            </>
          )}
          <div
            style={{
              fontSize: '0.68rem',
              color: 'var(--td-text-color-placeholder)',
              textAlign: isExpanded ? 'left' : 'center',
            }}
          >
            {isExpanded ? 'v1.0.0' : 'v1'}
          </div>
        </div>
        </div>
      </Aside>

      <Layout>
        <Header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            height: 56,
            borderBottom: '1px solid var(--td-component-border)',
            background: 'var(--td-bg-color-container)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              variant="text"
              shape="square"
              icon={sidebarOpen ? <MenuFoldIcon /> : <MenuUnfoldIcon />}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} />
        </Header>

        <Content style={{ padding: '16px 24px 24px', overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
