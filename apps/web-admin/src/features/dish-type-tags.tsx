import { useState } from 'react';
import useSWR from 'swr';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import InputNumber from 'tdesign-react/es/input-number';
import Dialog from 'tdesign-react/es/dialog';
import Space from 'tdesign-react/es/space';
import {
  createDishTypeTag,
  DEFAULT_DISH_TYPE_TAGS,
  fetchDishTypeTags,
  removeDishTypeTag,
  updateDishTypeTag,
  type DishTypeTagDraft,
  type DishTypeTagRecord,
} from '../lib/api';
import { DataTable, type Column } from '../components/data-table';
import { showDeleteConfirm } from '../components/delete-confirm-dialog';
import { toast } from '../lib/toast';

function createDefaultDraft(): DishTypeTagDraft {
  return { name: '', relatedIngredients: '', minMainIng: 0, sortOrder: 0 };
}

function draftFromRecord(record: DishTypeTagRecord): DishTypeTagDraft {
  return {
    id: record.id,
    name: record.name,
    relatedIngredients: record.rules.relatedIngredients.join(','),
    minMainIng: record.rules.minMainIng,
    sortOrder: record.sortOrder,
  };
}

const COLUMNS: Column<DishTypeTagRecord>[] = [
  { colKey: 'name', title: '名称', searchable: true },
  { colKey: 'keywords', title: '关键词', cell: ({ row }) => row.rules.relatedIngredients.join(', ') || '-' },
  { colKey: 'minMainIng', title: '最少主料', cell: ({ row }) => String(row.rules.minMainIng) },
  { colKey: 'sortOrder', title: '排序' },
];

export function DishTypeTagsPage() {
  const { data: items = [], isLoading, mutate } = useSWR('dish-type-tags', fetchDishTypeTags, {
    fallbackData: DEFAULT_DISH_TYPE_TAGS,
    onError: () => { /* use fallback data */ },
  });
  const displayItems = items.length > 0 ? items : DEFAULT_DISH_TYPE_TAGS;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<DishTypeTagDraft>(createDefaultDraft());
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setDraft(createDefaultDraft());
    setDialogOpen(true);
  }

  function openEdit(record: DishTypeTagRecord) {
    setDraft(draftFromRecord(record));
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = draft.id ? await updateDishTypeTag(draft) : await createDishTypeTag(draft);
      await mutate();
      setDraft(draftFromRecord(saved));
      toast.success(draft.id ? '标签已更新' : '标签已创建');
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存标签失败');
    } finally {
      setSaving(false);
    }
  }

  function handleRemove(record: DishTypeTagRecord) {
    if (!record.id) return;
    showDeleteConfirm({
      title: '确认删除标签',
      content: `确定要删除标签「${record.name}」吗？`,
      onConfirm: async () => {
        await removeDishTypeTag(record.id!);
        await mutate();
        toast.success('标签已删除');
      },
    });
  }

  const actionCell = ({ row }: { row: DishTypeTagRecord }) => (
    <Space>
      <Button size="small" variant="outline" onClick={() => openEdit(row)}>编辑</Button>
      {row.id ? (
        <Button size="small" theme="danger" variant="outline" onClick={() => handleRemove(row)}>删除</Button>
      ) : null}
    </Space>
  );

  const allColumns: Column<DishTypeTagRecord>[] = [
    ...COLUMNS,
    { colKey: 'action', title: '操作', width: 160, cell: actionCell },
  ];

  return (
    <div className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button theme="primary" onClick={openCreate}>新建标签</Button>
      </div>

      <DataTable<DishTypeTagRecord>
        columns={allColumns}
        data={displayItems}
        loading={isLoading}
        rowKey="id"
        searchPlaceholder="搜索标签名称..."
        emptyText="暂无标签数据"
        pageSize={10}
        showPagination={false}
      />

      <Dialog
        visible={dialogOpen}
        onClose={() => setDialogOpen(false)}
        header={draft.id ? '编辑标签' : '新建标签'}
        footer={
          <Space>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button theme="primary" onClick={handleSave} loading={saving}>保存</Button>
          </Space>
        }
        width={560}
      >
        <div className="grid-form">
          <label>
            <span>名称</span>
            <Input value={draft.name} onChange={(v) => setDraft((cur) => ({ ...cur, name: v as string }))} />
          </label>
          <label>
            <span>关联食材类别</span>
            <Input
              value={draft.relatedIngredients}
              onChange={(v) => setDraft((cur) => ({ ...cur, relatedIngredients: v as string }))}
              placeholder="关键词，用逗号分隔"
            />
          </label>
          <label>
            <span>最少主料数量</span>
            <InputNumber value={draft.minMainIng} onChange={(v) => setDraft((cur) => ({ ...cur, minMainIng: Number(v) }))} />
          </label>
          <label>
            <span>排序</span>
            <InputNumber value={draft.sortOrder} onChange={(v) => setDraft((cur) => ({ ...cur, sortOrder: Number(v) }))} />
          </label>
        </div>
      </Dialog>
    </div>
  );
}
