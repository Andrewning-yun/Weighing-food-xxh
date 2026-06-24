import { Text, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchAlgorithmConfig,
  updateAlgorithmConfig,
  type AlgorithmConfigGroups,
} from '../../api/algorithm-config';
import { getActiveStoreId, getActiveStoreName, getSessionUser, hasSession } from '../../utils/session';
import './index.scss';

type ConfigSection = {
  key: keyof AlgorithmConfigGroups;
  title: string;
};

const SECTIONS: ConfigSection[] = [
  { key: 'freshness', title: '新鲜度' },
  { key: 'profit', title: '毛利' },
  { key: 'diversity', title: '多样性' },
  { key: 'feedback', title: '反馈' },
  { key: 'output', title: '输出控制' },
];

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function normalizeGroups(value?: AlgorithmConfigGroups) {
  return value || {};
}

export default function AlgorithmConfigPage() {
  const user = getSessionUser();
  const role = user?.role || '';
  const canSave = role === 'admin';
  const storeId = getActiveStoreId(user);
  const storeName = getActiveStoreName(user) || user?.storeName || user?.storeId || '未选择门店';

  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState<AlgorithmConfigGroups>({});
  const [openKey, setOpenKey] = useState<keyof AlgorithmConfigGroups>('freshness');
  const [assistantPrompt, setAssistantPrompt] = useState('');

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }
    void bootstrap();
  }, [storeId]);

  async function bootstrap() {
    if (!storeId) {
      setBusy(false);
      setMessage('请先选择门店后再查看算法配置。');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const data = await fetchAlgorithmConfig(storeId);
      setConfig(normalizeGroups(data.config));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载算法配置失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!canSave || saving || !storeId) {
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await updateAlgorithmConfig({
        storeId,
        config,
      });
      Taro.showToast({ title: '配置已保存', icon: 'success' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存算法配置失败');
    } finally {
      setSaving(false);
    }
  }

  const visibleSections = useMemo(() => SECTIONS.filter((item) => item.key !== 'ticketPrice'), []);

  return (
    <View className='alg-page'>
      <View className='shell-card alg-hero'>
        <View>
          <Text className='alg-eyebrow'>推荐配置</Text>
          <Text className='alg-title'>算法参数</Text>
          <Text className='alg-subtitle'>{storeName}</Text>
        </View>
        <NutButton size='mini' onClick={bootstrap} loading={busy}>
          刷新
        </NutButton>
      </View>

      {!canSave ? <Text className='alg-tip'>当前角色只能查看配置，保存权限仍由管理员持有。</Text> : null}
      {message ? <Text className='alg-message'>{message}</Text> : null}

      {busy ? <View className='shell-card alg-loading'>正在加载算法配置...</View> : null}

      {!busy ? (
        <>
          {visibleSections.map((section) => {
            const group = config[section.key] || {};
            const entries = Object.entries(group);

            return (
              <View key={section.key} className='shell-card alg-section'>
                <View className='alg-section-head' onClick={() => setOpenKey(section.key)}>
                  <Text className='alg-section-title'>{section.title}</Text>
                  <Text className='alg-section-arrow'>{openKey === section.key ? '收起' : '展开'}</Text>
                </View>

                {openKey === section.key ? (
                  <View className='alg-field-list'>
                    {entries.length > 0 ? (
                      entries.map(([field, value]) => (
                        <View key={field} className='alg-field'>
                          <Text className='alg-field-label'>{field}</Text>
                          <NutInput
                            className='alg-input'
                            type='digit'
                            value={String(value)}
                            onChange={(v) =>
                              setConfig((prev) => ({
                                ...prev,
                                [section.key]: {
                                  ...(prev[section.key] || {}),
                                  [field]: Number(v) || 0,
                                },
                              }))
                            }
                          />
                        </View>
                      ))
                    ) : (
                      <Text className='alg-empty'>当前分组暂时没有字段。</Text>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}

          <View className='shell-card alg-section'>
            <Text className='alg-section-title'>AI 调参助手</Text>
            <NutInput
              className='alg-input'
              placeholder='先保留输入框骨架，后续接入自然语言调参'
              value={assistantPrompt}
              onChange={(v) => setAssistantPrompt(v)}
            />
            <View className='alg-assistant-actions'>
              <NutButton size='mini' disabled>
                发送
              </NutButton>
              <Text className='alg-empty'>白名单与规则面板将在下一阶段接入。</Text>
            </View>
          </View>

          <View className='alg-actions'>
            <NutButton disabled={!canSave} loading={saving} type='primary' onClick={handleSave}>
              保存配置
            </NutButton>
          </View>
        </>
      ) : null}
    </View>
  );
}
