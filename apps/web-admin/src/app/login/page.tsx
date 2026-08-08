'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { storeToken, type LoginResult } from '@/lib/api';
import { getDefaultRoute } from '@/lib/routes';
import { LoginPage } from '@/features/login';

export default function LoginRoute() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const setCurrentStore = useAppStore((s) => s.setCurrentStore);

  function handleLoggedIn(session: LoginResult) {
    setUser(session.user);
    storeToken(session.token);
    // 初始化当前门店：绑定门店的角色直接锁定，admin/buyer 由顶部门店切换器选择
    if (session.user.storeId) {
      setCurrentStore({
        id: session.user.storeId,
        name: session.user.storeName || '',
      });
    }
    // Write cookie for middleware
    document.cookie = `web-admin-token=${encodeURIComponent(session.token)}; path=/; max-age=86400; SameSite=Lax`;
    router.replace(getDefaultRoute(session.user));
  }

  return <LoginPage onLoggedIn={handleLoggedIn} />;
}
