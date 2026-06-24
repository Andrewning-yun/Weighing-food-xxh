import { useState } from 'react';
import useSWR from 'swr';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import InputNumber from 'tdesign-react/es/input-number';
import Select from 'tdesign-react/es/select';
import Textarea from 'tdesign-react/es/textarea';
import Dialog from 'tdesign-react/es/dialog';
import Space from 'tdesign-react/es/space';
import {
  fetchIngredients,
  removeIngredient,
  saveIngredient,
  type IngredientDraft,
  type IngredientRecord,
} from '../lib/api';
import { DataTable, type Column } from '../components/data-table';
import { showDeleteConfirm } from '../components/delete-confirm-dialog';
import { toast } from '../lib/toast';
import { formatDateTime } from '../lib/format';

const CATEGORY_OPTIONS = [
  { value: 'vegetable', label: '蔬菜' },
  { value: 'meat', label: '肉类' },
  { value: 'poultry', label: '禽类' },
  { value: 'seafood', label: '水产' },
  { value: 'seasoning', label: '调味料' },
  { value: 'staple', label: '主食' },
  { value: 'other', label: '其他' },
] as const;

const TYPE_OPTIONS = [
  { value: 'main', label: '主料' },
  { value: 'sub', label: '辅料' },
] as const;

const PERISHABLE_OPTIONS = [
  { value: 'no', label: '否' },
  { value: 'yes', label: '是' },
];

const EMPTY_INGREDIENT: IngredientDraft = {
  name: '',
  unit: 'kg',
  stock: 0,
  minStock: 0,
  cost: 0,
  note: '',
  category: 'other',
  perishable: false,
  type: 'main',
};

function getCategoryLabel(category?: string) {
  return CATEGORY_OPTIONS.find((item) => item.value === category)?.label || category || '未分类';
}

function getTypeLabel(type?: 'main' | 'sub') {
  return TYPE_OPTIONS.find((item) => item.value === type)?.label || '未设置';
}

function createDraftFromRecord(record: IngredientRecord): IngredientDraft {
  return {
    id: record.id,
    name: record.name,
    unit: record.unit,
    stock: record.stock,
    minStock: record.minStock,
    cost: record.cost,
    note: record.note,
    category: record.category || 'other',
    perishable: Boolean(record.perishable),
    type: record.type || 'main',
  };
}

const COLUMNS: Column<IngredientRecord>[] = [
  { colKey: 'name', title: '名称', searchable: true },
  { colKey: 'category', title: '分类', cell: ({ row }) => getCategoryLabel(row.category) },
  { colKey: 'type', title: '类型', cell: ({ row }) => getTypeLabel(row.type) },
  { colKey: 'perishable', title: '易腐', cell: ({ row }) => row.perishable ? '是' : '否' },
  { colKey: 'unit', title: '单位' },
  { colKey: 'cost', title: '成本' },
  { colKey: 'updatedAt', title: '更新时间', cell: ({ row }) => formatDateTime(row.updatedAt) },
];

export function IngredientsPage() {
  const { data: items = [], isLoading, mutate } = useSWR('ingredients', fetchIngredients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<IngredientDraft>(EMPTY_INGREDIENT);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setDraft(EMPTY_INGREDIENT);
    setDialogOpen(true);
  }

  function openEdit(record: IngredientRecord) {
    setDraft(createDraftFromRecord(record));
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveIngredient(draft);
      await mutate();
      toast.success(draft.id ? '食材已更新' : '食材已创建');
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存食材失败');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(record: IngredientRecord) {
    showDeleteConfirm({
      title: '确认删除食材',
      content: `确定要删除食材「${record.name}」吗？删除后将无法恢复。`,
      onConfirm: async () => {
        await removeIngredient(record.id);
        await mutate();
        toast.success('食材已删除');
      },
    });
  }

  const actionCell = ({ row }: { row: IngredientRecord }) => (
    <Space>
      <Button size="small" variant="outline" onClick={() => openEdit(row)}>编辑</Button>
      <Button size="small" theme="danger" variant="outline" onClick={() => handleDelete(row)}>删除</Button>
    </Space>
  );

  const allColumns: Column<IngredientRecord>[] = [
    ...COLUMNS,
    { colKey: 'action', title: '操作', width: 160, cell: actionCell },
  ];

  return (
    <div className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button theme="primary" onClick={openCreate}>新建食材</Button>
      </div>

      <DataTable<IngredientRecord>
        columns={allColumns}
        data={items}
        loading={isLoading}
        rowKey="id"
        searchPlaceholder="搜索食材名称..."
        emptyText="暂无食材数据"
        emptyDescription={'点击"新建食材"按钮添加第一条食材记录'}
        pageSize={15}
      />

      <Dialog
        visible={dialogOpen}
        onClose={() => setDialogOpen(false)}
        header={draft.id ? '编辑食材' : '新建食材'}
        footer={
          <Space>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button theme="primary" onClick={handleSave} loading={saving}>保存</Button>
          </Space>
        }
        width={640}
      >
        <div className="grid-form">
          <label>
            <span>名称</span>
            <Input value={draft.name} onChange={(v) => setDraft((cur) => ({ ...cur, name: v as string }))} />
          </label>
          <label>
            <span>单位</span>
            <Input value={draft.unit} onChange={(v) => setDraft((cur) => ({ ...cur, unit: v as string }))} />
          </label>
          <label>
            <span>分类</span>
            <Select value={draft.category || 'other'} onChange={(v) => setDraft((cur) => ({ ...cur, category: v as string }))} options={[...CATEGORY_OPTIONS]} clearable={false} />
          </label>
          <label>
            <span>类型</span>
            <Select value={draft.type || 'main'} onChange={(v) => setDraft((cur) => ({ ...cur, type: v as 'main' | 'sub' }))} options={[...TYPE_OPTIONS]} clearable={false} />
          </label>
          <label>
            <span>库存</span>
            <InputNumber value={draft.stock} onChange={(v) => setDraft((cur) => ({ ...cur, stock: Number(v) }))} min={0} />
          </label>
          <label>
            <span>最低库存</span>
            <InputNumber value={draft.minStock} onChange={(v) => setDraft((cur) => ({ ...cur, minStock: Number(v) }))} min={0} />
          </label>
          <label>
            <span>成本</span>
            <InputNumber value={draft.cost} onChange={(v) => setDraft((cur) => ({ ...cur, cost: Number(v) }))} min={0} decimalPlaces={2} />
          </label>
          <label>
            <span>易腐</span>
            <Select value={draft.perishable ? 'yes' : 'no'} onChange={(v) => setDraft((cur) => ({ ...cur, perishable: v === 'yes' }))} options={PERISHABLE_OPTIONS} clearable={false} />
          </label>
          <label className="grid-span-2">
            <span>备注</span>
            <Textarea value={draft.note} onChange={(v) => setDraft((cur) => ({ ...cur, note: v as string }))} />
          </label>
        </div>
      </Dialog>
    </div>
  );
}
