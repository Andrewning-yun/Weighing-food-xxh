import { useState, useEffect } from 'react';
import Form from 'tdesign-react/es/form';
import Input from 'tdesign-react/es/input';
import Button from 'tdesign-react/es/button';
import { login, storeToken, type LoginResult } from '../lib/api';

const { FormItem } = Form;

export interface LoginPageProps {
  onLoggedIn: (session: LoginResult) => void;
}

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUsername('admin');
    setPassword('admin1234');
  }, []);

  async function handleSubmit() {
    setBusy(true);
    setError(null);

    try {
      const session = await login(username.trim(), password);
      storeToken(session.token);
      onLoggedIn(session);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败');
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) {
    return (
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="section-kicker">后台登录</span>
          <h3>登录后管理食材、菜品和门店运营数据。</h3>
          <p>正在加载登录表单...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <div className="auth-copy">
        <span className="section-kicker">后台登录</span>
        <h3>登录后管理食材、菜品和门店运营数据。</h3>
        <p>
          当前后台直接连接现有接口契约，后端即使继续收口和增强，也不需要重新改动整体页面结构。
        </p>
      </div>

      <Form onSubmit={handleSubmit} labelAlign="top" colon={false}>
        <FormItem label="用户名" name="username">
          <Input value={username} onChange={(v) => setUsername(v as string)} placeholder="请输入用户名" />
        </FormItem>

        <FormItem label="密码" name="password">
          <Input type="password" value={password} onChange={(v) => setPassword(v as string)} placeholder="请输入密码" />
        </FormItem>

        {error ? <p className="form-error">{error}</p> : null}

        <FormItem>
          <Button type="submit" theme="primary" loading={busy} block>
            {busy ? '登录中...' : '登录'}
          </Button>
        </FormItem>
      </Form>
    </div>
  );
}
