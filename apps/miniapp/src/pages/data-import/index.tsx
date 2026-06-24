import { Text, Textarea, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import {
  executeDataImport,
  parseDataImport,
  type DataImportMode,
  type DataImportType,
  type ExecuteDataImportResponse,
  type ParseDataImportResponse,
} from '../../api/data-import';
import { getSessionUser, hasSession } from '../../utils/session';
import './index.scss';

const STEPS = ['选择类型', '粘贴数据', '预览验证', '选择模式', '执行导入'];
const TYPES: Array<{ value: DataImportType; label: string }> = [
  { value: 'ingredient', label: '食材' },
  { value: 'dish', label: '菜品' },
];
const MODES: Array<{ value: DataImportMode; label: string }> = [
  { value: 'merge', label: '合并更新' },
  { value: 'replace', label: '整体替换' },
  { value: 'skip_duplicate', label: '忽略重复' },
];

const SAMPLE_TEXT = `{
  "items": [
    {
      "name": "青椒",
      "category": "蔬菜",
      "unit": "斤",
      "pricePerUnit": 6.5,
      "isPerishable": true
    }
  ]
}`;

export default function DataImportPage() {
  const role = getSessionUser()?.role || '';
  const canUse = role === 'admin';

  const [step, setStep] = useState(0);
  const [type, setType] = useState<DataImportType>('ingredient');
  const [mode, setMode] = useState<DataImportMode>('merge');
  const [rawText, setRawText] = useState(SAMPLE_TEXT);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<ParseDataImportResponse | null>(null);
  const [result, setResult] = useState<ExecuteDataImportResponse | null>(null);

  function ensureSession() {
    if (!hasSession()) {
      Taro.reLaunch({ url: '/pages/login/index' });
      return false;
    }
    return true;
  }

  async function handleParse() {
    if (!ensureSession() || !canUse) {
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const data = await parseDataImport({ type, mode, rawText });
      setPreview(data);
      setResult(null);
      setStep(2);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '解析导入数据失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute() {
    if (!ensureSession() || !canUse || !preview?.items?.length) {
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const data = await executeDataImport({
        type,
        mode,
        items: preview.items,
        rawText,
      });
      setResult(data);
      setStep(4);
      Taro.showToast({ title: data.success ? '导入完成' : '导入失败', icon: data.success ? 'success' : 'none' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '执行导入失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className='import-page'>
      <View className='shell-card import-hero'>
        <Text className='import-title'>数据导入</Text>
        <Text className='import-subtitle'>当前版本支持 JSON 粘贴导入，后端会先解析校验，再执行导入。</Text>
      </View>

      <View className='import-steps'>
        {STEPS.map((item, index) => (
          <Text key={item} className={`import-step ${step === index ? 'import-step-active' : ''}`} onClick={() => setStep(index)}>
            {index + 1}. {item}
          </Text>
        ))}
      </View>

      {!canUse ? <Text className='import-message'>当前角色无权使用数据导入，只有管理员可操作。</Text> : null}
      {message ? <Text className='import-message'>{message}</Text> : null}

      <View className='shell-card import-step-card'>
        {step === 0 ? (
          <>
            <Text className='import-copy'>导入类型</Text>
            <View className='import-mode-row'>
              {TYPES.map((item) => (
                <Text key={item.value} className={`import-mode ${type === item.value ? 'import-mode-active' : ''}`} onClick={() => setType(item.value)}>
                  {item.label}
                </Text>
              ))}
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text className='import-copy'>粘贴 JSON 数据</Text>
            <Textarea className='import-textarea' value={rawText} onInput={(e) => setRawText(e.detail.value)} />
            <Text className='import-placeholder'>请粘贴 `{"{"}"items":[...]{"}"}` 格式的 JSON，先解析再预览。</Text>
            <NutButton type='primary' loading={busy} disabled={!canUse} onClick={() => void handleParse()}>
              解析并预览
            </NutButton>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text className='import-copy'>预览与校验</Text>
            <Text className='import-placeholder'>共 {preview?.total || 0} 条，{preview?.valid ? '校验通过' : '存在校验问题'}</Text>
            {preview?.issues?.length ? (
              <View className='import-issue-list'>
                {preview.issues.map((item, index) => (
                  <Text key={`${item.row}-${index}`} className='import-issue-item'>
                    第 {item.row} 行：{item.message}
                  </Text>
                ))}
              </View>
            ) : (
              <View className='import-preview-list'>
                {(preview?.items || []).slice(0, 5).map((item, index) => (
                  <Text key={`preview-${index}`} className='import-preview-item'>
                    {JSON.stringify(item)}
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text className='import-copy'>导入模式</Text>
            <View className='import-mode-row'>
              {MODES.map((item) => (
                <Text key={item.value} className={`import-mode ${mode === item.value ? 'import-mode-active' : ''}`} onClick={() => setMode(item.value)}>
                  {item.label}
                </Text>
              ))}
            </View>
            <Text className='import-placeholder'>`合并更新` 会按名称更新，`整体替换` 会先清空同类型数据，`忽略重复` 会跳过同名数据。</Text>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text className='import-copy'>执行结果</Text>
            {result ? (
              <View className='import-result-grid'>
                <Text className='import-preview-item'>总数：{result.total}</Text>
                <Text className='import-preview-item'>新增：{result.created}</Text>
                <Text className='import-preview-item'>更新：{result.updated}</Text>
                <Text className='import-preview-item'>跳过：{result.skipped}</Text>
              </View>
            ) : (
              <Text className='import-placeholder'>执行完成后，这里会展示导入结果。</Text>
            )}
          </>
        ) : null}
      </View>

      <View className='import-actions'>
        <NutButton onClick={() => setStep((prev) => Math.max(0, prev - 1))}>上一步</NutButton>
        <NutButton onClick={() => setStep((prev) => Math.min(STEPS.length - 1, prev + 1))}>下一步</NutButton>
        {step === 3 ? (
          <NutButton type='primary' loading={busy} disabled={!canUse || !preview?.valid} onClick={() => void handleExecute()}>
            开始导入
          </NutButton>
        ) : null}
      </View>
    </View>
  );
}
