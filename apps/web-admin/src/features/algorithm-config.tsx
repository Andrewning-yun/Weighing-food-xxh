import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import InputNumber from 'tdesign-react/es/input-number';
import Select from 'tdesign-react/es/select';
import {
  DEFAULT_ALGORITHM_CONFIG,
  fetchAlgorithmConfig,
  fetchStores,
  saveAlgorithmConfig,
  type AlgorithmConfigState,
} from '../lib/api';
import { toast } from '../lib/toast';

function cloneConfig(config: AlgorithmConfigState): AlgorithmConfigState {
  return JSON.parse(JSON.stringify(config)) as AlgorithmConfigState;
}

export function AlgorithmConfigPage() {
  const { data: stores = [] } = useSWR('algo-stores', fetchStores);
  const [queryStoreId, setQueryStoreId] = useState('');
  const [config, setConfig] = useState<AlgorithmConfigState>(cloneConfig(DEFAULT_ALGORITHM_CONFIG));
  const [saving, setSaving] = useState(false);

  // Set initial store
  if (!queryStoreId && stores.length > 0) {
    setQueryStoreId(stores[0].id);
  }

  const { isLoading } = useSWR(
    queryStoreId ? ['algorithm-config', queryStoreId] : null,
    () => fetchAlgorithmConfig({ storeId: queryStoreId }),
    {
      onSuccess: (data) => setConfig(cloneConfig(data)),
      onError: (err) => {
        setConfig(cloneConfig(DEFAULT_ALGORITHM_CONFIG));
        toast.error(err instanceof Error ? err.message : '加载算法参数失败');
      },
    },
  );

  const currentStore = useMemo(
    () => stores.find((store) => store.id === queryStoreId) || null,
    [queryStoreId, stores],
  );

  async function handleSave() {
    setSaving(true);

    try {
      const saved = await saveAlgorithmConfig({
        storeId: queryStoreId,
        config,
      });
      setConfig(cloneConfig(saved));
      toast.success('算法参数已保存。');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存算法参数失败');
    } finally {
      setSaving(false);
    }
  }

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="page-stack">
      <Card title="算法参数" subtitle="以结构化方式编辑推荐系统参数。"
        actions={<Button theme="primary" onClick={handleSave} loading={saving} disabled={!queryStoreId}>保存参数</Button>} bordered>
        {isLoading ? <p className="muted">正在加载算法参数...</p> : null}

        <div className="grid-form">
          <label>
            <span className="detail-label">门店</span>
            <Select value={queryStoreId || undefined} onChange={(v) => setQueryStoreId(v as string)} options={storeOptions} placeholder="请选择门店" clearable={false} />
          </label>
          <label>
            <span className="detail-label">门店名称</span>
            <Input value={currentStore?.name || ''} readonly />
          </label>
        </div>
      </Card>

      <Card title="客单价参数" subtitle="客单价偏差调节参数。" bordered>
        <div className="grid-form">
          <label>
            <span className="detail-label">偏差阈值</span>
            <InputNumber value={config.ticketPrice.deviationThreshold} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                ticketPrice: { ...current.ticketPrice, deviationThreshold: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">低客单价荤菜加分</span>
            <InputNumber value={config.ticketPrice.lowTicketMeatBonus} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                ticketPrice: { ...current.ticketPrice, lowTicketMeatBonus: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">低客单价素菜减分</span>
            <InputNumber value={config.ticketPrice.lowTicketVegPenalty} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                ticketPrice: { ...current.ticketPrice, lowTicketVegPenalty: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">高客单价高毛利加分</span>
            <InputNumber value={config.ticketPrice.highTicketHighMarginBonus} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                ticketPrice: { ...current.ticketPrice, highTicketHighMarginBonus: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">高客单价低毛利减分</span>
            <InputNumber value={config.ticketPrice.highTicketLowMarginPenalty} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                ticketPrice: { ...current.ticketPrice, highTicketLowMarginPenalty: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">倍率上限</span>
            <InputNumber value={config.ticketPrice.scaleCap} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                ticketPrice: { ...current.ticketPrice, scaleCap: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
        </div>
      </Card>

      <Card title="新鲜度 / 毛利 / 多样性" subtitle="核心评分权重配置。" bordered>
        <div className="grid-form">
          <label>
            <span className="detail-label">回看天数</span>
            <InputNumber value={config.freshness.lookbackDays} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                freshness: { ...current.freshness, lookbackDays: Number(v) },
              }))
            } />
          </label>
          <label>
            <span className="detail-label">新鲜度加分</span>
            <InputNumber value={config.freshness.freshnessBonus} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                freshness: { ...current.freshness, freshnessBonus: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">新鲜度减分</span>
            <InputNumber value={config.freshness.freshnessPenalty} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                freshness: { ...current.freshness, freshnessPenalty: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">高毛利平衡系数</span>
            <InputNumber value={config.profit.highMarginBalance} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                profit: { ...current.profit, highMarginBalance: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">中毛利平衡系数</span>
            <InputNumber value={config.profit.mediumMarginBalance} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                profit: { ...current.profit, mediumMarginBalance: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">客流平衡系数</span>
            <InputNumber value={config.profit.trafficBalance} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                profit: { ...current.profit, trafficBalance: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">每个属性加分</span>
            <InputNumber value={config.diversity.perAttributeBonus} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                diversity: { ...current.diversity, perAttributeBonus: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">多样性减分</span>
            <InputNumber value={config.diversity.diversityPenalty} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                diversity: { ...current.diversity, diversityPenalty: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
        </div>
      </Card>

      <Card title="分类 / 反馈 / 输出" subtitle="分类、剩余反馈和输出控制参数。" bordered>
        <div className="grid-form">
          <label>
            <span className="detail-label">低阈值</span>
            <InputNumber value={config.category.lowThreshold} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                category: { ...current.category, lowThreshold: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">低档加分</span>
            <InputNumber value={config.category.lowBonus} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                category: { ...current.category, lowBonus: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">高阈值</span>
            <InputNumber value={config.category.highThreshold} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                category: { ...current.category, highThreshold: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">高档减分</span>
            <InputNumber value={config.category.highPenalty} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                category: { ...current.category, highPenalty: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">高剩余减分</span>
            <InputNumber value={config.feedback.highLeftoverPenalty} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                feedback: { ...current.feedback, highLeftoverPenalty: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">中剩余减分</span>
            <InputNumber value={config.feedback.mediumLeftoverPenalty} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                feedback: { ...current.feedback, mediumLeftoverPenalty: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">低剩余加分</span>
            <InputNumber value={config.feedback.lowLeftoverBonus} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                feedback: { ...current.feedback, lowLeftoverBonus: Number(v) },
              }))
            } decimalPlaces={2} />
          </label>
          <label>
            <span className="detail-label">推荐数量上限</span>
            <InputNumber value={config.output.recommendLimit} onChange={(v) =>
              setConfig((current) => ({
                ...current,
                output: { ...current.output, recommendLimit: Number(v) },
              }))
            } />
          </label>
        </div>
      </Card>
    </div>
  );
}
