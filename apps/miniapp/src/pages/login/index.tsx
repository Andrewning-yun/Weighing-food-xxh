import { Text, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import {
  bindCode,
  fetchBindStatus,
  generateBindCode,
  login,
  wxLogin,
} from '../../api/auth';
import {
  clearSession,
  formatRoleLabel,
  getSessionUser,
  setSessionUser,
  setToken,
  toSessionUser,
} from '../../utils/session';
import './index.scss';

type LoginMode = 'wechat' | 'password' | 'bind';

function redirectHome() {
  Taro.reLaunch({ url: '/pages/index/index' });
}

async function getWechatCode() {
  const result = await Taro.login();
  if (!result.code) {
    throw new Error('微信登录失败，请稍后再试');
  }
  return result.code;
}

export default function LoginPage() {
  const [sessionUser, setSessionUserState] = useState(getSessionUser());
  const [mode, setMode] = useState<LoginMode>('wechat');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin1234');
  const [bindCodeValue, setBindCodeValue] = useState('');
  const [bindUsername, setBindUsername] = useState('');
  const [message, setMessage] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdminSession = sessionUser?.role === 'admin';

  useEffect(() => {
    if (sessionUser) {
      setMessage(`当前账号：${sessionUser.displayName}（${formatRoleLabel(sessionUser.role)}）`);
    }
  }, [sessionUser]);

  function handleLoginSuccess(result: { token: string; user: Parameters<typeof toSessionUser>[0] }) {
    setToken(result.token);
    const user = toSessionUser(result.user);
    setSessionUser(user);
    setSessionUserState(user);
    redirectHome();
  }

  async function handleWechatLogin() {
    setBusy(true);
    setMessage('');

    try {
      const code = await getWechatCode();
      const bindStatus = await fetchBindStatus(code);

      if (!bindStatus.bound) {
        setMode('bind');
        setMessage('请先绑定账号');
        return;
      }

      const result = await wxLogin(code);
      handleLoginSuccess(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '微信登录失败');
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordLogin() {
    setBusy(true);
    setMessage('');

    try {
      const result = await login({
        username: username.trim(),
        password,
      });
      handleLoginSuccess(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '登录失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleBindCode() {
    setBusy(true);
    setMessage('');

    try {
      const code = await getWechatCode();
      const result = await bindCode(bindCodeValue.trim(), code);
      handleLoginSuccess(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '绑定失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateBindCode() {
    if (!isAdminSession) return;
    setBusy(true);
    setMessage('');

    try {
      const result = await generateBindCode(bindUsername.trim());
      setGeneratedCode(result.code);
      setMessage(`已为 ${result.user.name || result.user.username} 生成绑定码`);
    } catch (error) {
      setGeneratedCode('');
      setMessage(error instanceof Error ? error.message : '生成绑定码失败');
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    clearSession();
    setSessionUserState(null);
    setGeneratedCode('');
    setMessage('已退出当前账号');
  }

  return (
    <View className='login-screen'>
      <View className='login-brand'>
        <Text className='login-brand-name'>快餐厨房</Text>
        <Text className='login-brand-copy'>门店日常工作台</Text>
      </View>

      <View className='login-panel'>
        <View className='login-mode-row'>
          <View className={`login-mode-item ${mode === 'wechat' ? 'login-mode-item-active' : ''}`} onClick={() => setMode('wechat')}>
            <Text className='login-mode-text'>微信登录</Text>
          </View>
          <View className={`login-mode-item ${mode === 'password' ? 'login-mode-item-active' : ''}`} onClick={() => setMode('password')}>
            <Text className='login-mode-text'>账号登录</Text>
          </View>
          <View className={`login-mode-item ${mode === 'bind' ? 'login-mode-item-active' : ''}`} onClick={() => setMode('bind')}>
            <Text className='login-mode-text'>绑定账号</Text>
          </View>
        </View>

        {mode === 'wechat' ? (
          <View className='login-mode-panel'>
            <Text className='login-title'>微信一键登录</Text>
            <Text className='login-copy'>已绑定账号可直接登录，未绑定时请先使用绑定账号。</Text>
            <NutButton type='primary' loading={busy} onClick={handleWechatLogin}>
              微信一键登录
            </NutButton>
          </View>
        ) : null}

        {mode === 'password' ? (
          <View className='login-mode-panel'>
            <Text className='login-title'>账号登录</Text>
            <View className='login-field'>
              <Text className='login-label'>用户名</Text>
              <NutInput
                className='login-input'
                value={username}
                placeholder='请输入用户名'
                onChange={(v) => setUsername(v)}
              />
            </View>
            <View className='login-field'>
              <Text className='login-label'>密码</Text>
              <NutInput
                className='login-input'
                type="password"
                value={password}
                placeholder='请输入密码'
                onChange={(v) => setPassword(v)}
              />
            </View>
            <NutButton type='primary' loading={busy} onClick={handlePasswordLogin}>
              登录
            </NutButton>
          </View>
        ) : null}

        {mode === 'bind' ? (
          <View className='login-mode-panel'>
            <Text className='login-title'>绑定账号</Text>
            <View className='login-field'>
              <Text className='login-label'>6 位绑定码</Text>
              <NutInput
                className='login-input'
                maxLength={6}
                value={bindCodeValue}
                placeholder='请输入绑定码'
                onChange={(v) => setBindCodeValue(v)}
              />
            </View>
            <NutButton type='primary' loading={busy} onClick={handleBindCode}>
              确认绑定
            </NutButton>

            {isAdminSession ? (
              <View className='login-admin-panel'>
                <Text className='login-admin-title'>生成绑定码</Text>
                <NutInput
                  className='login-input'
                  value={bindUsername}
                  placeholder='请输入员工账号'
                  onChange={(v) => setBindUsername(v)}
                />
                <NutButton loading={busy} onClick={handleGenerateBindCode}>
                  生成绑定码
                </NutButton>
                {generatedCode ? <Text className='login-code'>绑定码：{generatedCode}</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {message ? <Text className='login-message'>{message}</Text> : null}

        {sessionUser ? (
          <View className='login-actions'>
            <NutButton onClick={redirectHome}>进入首页</NutButton>
            <NutButton onClick={handleSignOut}>退出当前账号</NutButton>
          </View>
        ) : null}
      </View>
    </View>
  );
}
