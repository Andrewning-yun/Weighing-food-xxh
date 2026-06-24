'use client';

import { ConfigProvider } from 'tdesign-react';
import 'tdesign-react/es/style/index.css';
import { AuthGate } from '@/lib/auth-gate';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ConfigProvider globalConfig={{}}>
          <AuthGate>{children}</AuthGate>
        </ConfigProvider>
      </body>
    </html>
  );
}
