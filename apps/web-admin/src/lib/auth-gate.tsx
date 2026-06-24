'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchCurrentUser, clearToken } from './api';
import { useAppStore } from './store';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const user = useAppStore((s) => s.user);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (pathname === '/login') {
      setBooting(false);
      return;
    }

    let mounted = true;

    async function bootstrap() {
      try {
        const currentUser = await fetchCurrentUser();
        if (mounted) setUser(currentUser);
      } catch {
        if (mounted) {
          clearToken();
          router.replace('/login');
        }
      } finally {
        if (mounted) setBooting(false);
      }
    }

    bootstrap();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to login if on protected route without user
  useEffect(() => {
    if (!booting && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [booting, user, pathname, router]);

  if (booting && pathname !== '/login') {
    return (
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="section-kicker">运营后台</span>
          <h3>正在恢复登录状态</h3>
          <p>系统正在校验令牌并加载当前账号的路由权限。</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
