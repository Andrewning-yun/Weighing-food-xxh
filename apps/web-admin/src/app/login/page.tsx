'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { storeToken, type LoginResult } from '@/lib/api';
import { LoginPage } from '@/features/login';

export default function LoginRoute() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);

  function handleLoggedIn(session: LoginResult) {
    setUser(session.user);
    storeToken(session.token);
    // Write cookie for middleware
    document.cookie = `web-admin-token=${encodeURIComponent(session.token)}; path=/; max-age=86400; SameSite=Lax`;
    router.replace('/ingredients');
  }

  return <LoginPage onLoggedIn={handleLoggedIn} />;
}
