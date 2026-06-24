import { useState } from 'react';
import useSWR from 'swr';
import Card from 'tdesign-react/es/card';
import Select from 'tdesign-react/es/select';
import Table from 'tdesign-react/es/table';
import Tag from 'tdesign-react/es/tag';
import {
  fetchStores,
  getCategoryDistributionAnalysis,
  getDishFrequencyAnalysis,
  getIngredientUsageAnalysis,
  getProfitDistributionAnalysis,
  type CategoryDistributionAnalysisItem,
  type DishFrequencyAnalysisItem,
  type IngredientUsageAnalysisItem,
  type MealTypeValue,
  type ProfitDistributionAnalysisItem,
} from '../lib/api';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
}

const MEAL_TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '正餐' },
];

export function AnalysisPage() {
  const { data: stores = [] } = useSWR('analysis-stores', fetchStores);
  const [storeId, setStoreId] = useState('');
  const [startDate, setStartDate] = useState(thirtyDaysAgo());
  const [endDate, setEndDate] = useState(today());
  const [mealType, setMealType] = useState<MealTypeValue | ''>('');

  // Set initial store
  if (!storeId && stores.length > 0) {
    setStoreId(stores[0].id);
  }

  const { data, isLoading } = useSWR(
    storeId ? ['analysis', storeId, startDate, endDate, mealType] : null,
    async () => {
      const query = { storeId, startDate, endDate, mealType: mealType || undefined };
      const [ingredients, dishes, profits, categories] = await Promise.all([
        getIngredientUsageAnalysis(query),
        getDishFrequencyAnalysis(query),
        getProfitDistributionAnalysis(query),
        getCategoryDistributionAnalysis(query),
      ]);
      return { ingredients, dishes, profits, categories };
    },
  );

  const ingredientUsage = data?.ingredients ?? [];
  const dishFrequency = data?.dishes ?? [];
  const profitDistribution = data?.profits ?? [];
  const categoryDistribution = data?.categories ?? [];

  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="page-stack">
      <Card title="菜品分析" subtitle="查看食材使用、菜品频次、毛利和分类分布"
        actions={isLoading ? <Tag theme="warning">加载中</Tag> : <Tag theme="success">已加载</Tag>} bordered>

        <div className="grid-form">
          <label>
            <span className="detail-label">门店</span>
            <Select value={storeId || undefined} onChange={(v) => setStoreId(v as string)} options={storeOptions} placeholder="请选择门店" clearable={false} />
          </label>
          <label>
            <span className="detail-label">餐别</span>
            <Select value={mealType || undefined} onChange={(v) => setMealType((v as MealTypeValue | '') || '')} options={MEAL_TYPE_OPTIONS} />
          </label>
          <label>
            <span className="detail-label">开始日期</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} style={{ width: '100%', borderRadius: 'var(--td-radius-default, 6px)', border: '1px solid var(--td-component-border)', padding: '5px 8px', height: 32, fontSize: '0.9rem', background: 'var(--td-bg-color-container)' }} />
          </label>
          <label>
            <span className="detail-label">结束日期</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} style={{ width: '100%', borderRadius: 'var(--td-radius-default, 6px)', border: '1px solid var(--td-component-border)', padding: '5px 8px', height: 32, fontSize: '0.9rem', background: 'var(--td-bg-color-container)' }} />
          </label>
        </div>
      </Card>

      <Card title="食材使用排行" subtitle="按使用量查看重点食材" bordered>
        <Table
          data={ingredientUsage}
          columns={[
            { colKey: 'ingredientName', title: '食材' },
            { colKey: 'totalQuantity', title: '总用量' },
            { colKey: 'unit', title: '单位' },
            { colKey: 'dishCount', title: '关联菜品数' },
          ]}
          rowKey="ingredientId"
          size="small"
          resizable
          hover
          stripe
        />
      </Card>

      <Card title="菜品频次排行" subtitle="按菜单出现次数查看热门菜品" bordered>
        <Table
          data={dishFrequency}
          columns={[
            { colKey: 'dishName', title: '菜品' },
            { colKey: 'count', title: '频次' },
            { colKey: 'category', title: '分类', cell: ({ row }) => (row as DishFrequencyAnalysisItem).category || '-' },
            { colKey: 'mealType', title: '餐别', cell: ({ row }) => (row as DishFrequencyAnalysisItem).mealType === 'breakfast' ? '早餐' : (row as DishFrequencyAnalysisItem).mealType === 'lunch' ? '正餐' : '-' },
          ]}
          rowKey="dishId"
          size="small"
          resizable
          hover
          stripe
        />
      </Card>

      <div className="inline-grid inline-grid-2">
        <Card title="毛利分布" subtitle="各毛利档位占比" bordered>
          <Table
            data={profitDistribution}
            columns={[
              { colKey: 'level', title: '档位' },
              { colKey: 'count', title: '数量' },
              { colKey: 'percentage', title: '占比', cell: ({ row }) => `${(row as ProfitDistributionAnalysisItem).percentage}%` },
            ]}
            rowKey="level"
            size="small"
            hover
            stripe
          />
        </Card>

        <Card title="分类分布" subtitle="各分类菜品占比" bordered>
          <Table
            data={categoryDistribution}
            columns={[
              { colKey: 'category', title: '分类' },
              { colKey: 'count', title: '数量' },
              { colKey: 'percentage', title: '占比', cell: ({ row }) => `${(row as CategoryDistributionAnalysisItem).percentage}%` },
            ]}
            rowKey="category"
            size="small"
            hover
            stripe
          />
        </Card>
      </div>
    </div>
  );
}
