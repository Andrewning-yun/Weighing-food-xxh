'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import InputNumber from 'tdesign-react/es/input-number';
import Select from 'tdesign-react/es/select';
import Dialog from 'tdesign-react/es/dialog';
import Space from 'tdesign-react/es/space';
import { pinyin } from 'pinyin-pro';
import {
  fetchStores,
  saveStore,
  type StoreDraft,
  type StoreRecord,
} from '../lib/api';
import { DataTable, type Column, FormField, ConfirmButton, ErrorBoundary } from '../components';
import { toast } from '../lib/toast';

function toPinyinInitials(text: string): string {
  return pinyin(text, { pattern: 'first', toneType: 'none', type: 'string' }).replace(/\s+/g, '').toLowerCase();
}

const STATUS_OPTIONS = [
  { value: 'open', label: '营业中' },
  { value: 'paused', label: '暂停' },
];

const EMPTY_STORE: StoreDraft = {
  name: '',
  code: '',
  city: '',
  status: 'open',
  manager: '',
  targetTicketPriceBreakfast: null,
  targetTicketPriceLunch: null,
  pricePerLiang: null,
  memberPricePerLiang: null,
  ricePrice: null,
};

function formatMoney(value?: number | null) {
  return value === undefined || value === null ? '-' : value.toFixed(2);
}

const COLUMNS: Column<StoreRecord>[] = [
  { colKey: 'name', title: '名称', searchable: true },
  { colKey: 'code', title: '编码' },
  { colKey: 'city', title: '地址' },
  { colKey: 'status', title: '状态' },
  { colKey: 'manager', title: '负责人' },
  {
    colKey: 'pricePerLiang',
    title: '原价/两',
    align: 'right',
    cell: ({ row }) => formatMoney(row.pricePerLiang),
  },
  {
    colKey: 'memberPricePerLiang',
    title: '会员价/两',
    align: 'right',
    cell: ({ row }) => formatMoney(row.memberPricePerLiang),
  },
  {
    colKey: 'ricePrice',
    title: '米饭价',
    align: 'right',
    cell: ({ row }) => formatMoney(row.ricePrice),
  },
];

function validateStore(draft: StoreDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = '门店名称不能为空';
  if (!draft.code) errors.code = '编码不能为空';
  return errors;
}

export function StoresPage() {
  const { data: items = [], isLoading, mutate } = useSWR('stores', fetchStores);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<StoreDraft>(EMPTY_STORE);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const openCreate = useCallback(() => {
    setDraft(EMPTY_STORE);
    setFormErrors({});
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((record: StoreRecord) => {
    setDraft({
      id: record.id,
      name: record.name,
      code: record.code,
      city: record.city,
      status: record.status,
      manager: record.manager,
      targetTicketPriceBreakfast: record.targetTicketPriceBreakfast ?? null,
      targetTicketPriceLunch: record.targetTicketPriceLunch ?? null,
      pricePerLiang: record.pricePerLiang ?? null,
      memberPricePerLiang: record.memberPricePerLiang ?? null,
      ricePrice: record.ricePrice ?? null,
    });
    setFormErrors({});
    setDialogOpen(true);
  }, []);

  const handleNameChange = useCallback((name: string) => {
    setDraft((cur) => ({
      ...cur,
      name,
      code: cur.id ? cur.code : toPinyinInitials(name),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    const errors = validateStore(draft);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await saveStore(draft);
      await mutate();
      toast.success(draft.id ? '门店已更新' : '门店已创建');
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存门店失败');
    } finally {
      setSaving(false);
    }
  }, [draft, mutate]);

  const handleRemove = useCallback(
    async (record: StoreRecord) => {
      try {
        const { removeStore } = await import('../lib/api');
        await removeStore(record.id);
        await mutate();
        toast.success(`门店「${record.name}」已删除`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '删除失败');
      }
    },
    [mutate],
  );

  const setDraftField = useCallback(
    <K extends keyof StoreDraft>(key: K, value: StoreDraft[K]) => {
      setDraft((cur) => ({ ...cur, [key]: value }));
    },
    [],
  );

  const actionCell = useMemo(
    () =>
      ({ row }: { row: StoreRecord }) => (
        <Space>
          <Button size="small" variant="outline" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <ConfirmButton
            size="small"
            variant="outline"
            danger
            confirmTitle="确认删除门店"
            confirmContent={`确定要删除门店「${row.name}」吗？此操作不可恢复。`}
            confirmText="删除"
            onConfirm={() => handleRemove(row)}
          >
            删除
          </ConfirmButton>
        </Space>
      ),
    [openEdit, handleRemove],
  );

  const allColumns: Column<StoreRecord>[] = useMemo(
    () => [
      ...COLUMNS,
      { colKey: 'action', title: '操作', width: 160, cell: actionCell },
    ],
    [actionCell],
  );

  return (
    <ErrorBoundary>
      <div className="page-stack">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <Button theme="primary" onClick={openCreate}>
            新建门店
          </Button>
        </div>

        <DataTable<StoreRecord>
          columns={allColumns}
          data={items}
          loading={isLoading}
          rowKey="id"
          searchPlaceholder="搜索门店名称..."
          emptyText="暂无门店数据"
          emptyDescription='点击"新建门店"按钮添加'
          pageSize={15}
        />

        <Dialog
          visible={dialogOpen}
          onClose={() => { setDialogOpen(false); setFormErrors({}); }}
          header={draft.id ? '编辑门店' : '新建门店'}
          footer={
            <Space>
              <Button variant="outline" onClick={() => { setDialogOpen(false); setFormErrors({}); }}>
                取消
              </Button>
              <Button theme="primary" onClick={handleSave} loading={saving}>
                保存
              </Button>
            </Space>
          }
          width={640}
        >
          <div className="grid-form">
            <FormField label="门店名称" required error={formErrors.name}>
              <Input
                value={draft.name}
                onChange={(v) => handleNameChange(v as string)}
              />
            </FormField>
            <FormField label="编码" required error={formErrors.code}>
              <Input
                value={draft.code}
                disabled
              />
            </FormField>
            <FormField label="地址">
              <Input
                value={draft.city}
                onChange={(v) => setDraftField('city', v as string)}
              />
            </FormField>
            <FormField label="状态">
              <Select
                value={draft.status}
                onChange={(v) =>
                  setDraftField('status', v as StoreDraft['status'])
                }
                options={STATUS_OPTIONS}
                clearable={false}
              />
            </FormField>
            <FormField label="负责人" className="grid-span-2">
              <Input
                value={draft.manager}
                onChange={(v) => setDraftField('manager', v as string)}
              />
            </FormField>
            <FormField label="目标早餐客单价" help="单位：元">
              <InputNumber
                value={draft.targetTicketPriceBreakfast ?? undefined}
                onChange={(v) =>
                  setDraftField(
                    'targetTicketPriceBreakfast',
                    v === undefined || v === null ? null : Number(v),
                  )
                }
                decimalPlaces={2}
              />
            </FormField>
            <FormField label="目标正餐客单价" help="单位：元">
              <InputNumber
                value={draft.targetTicketPriceLunch ?? undefined}
                onChange={(v) =>
                  setDraftField(
                    'targetTicketPriceLunch',
                    v === undefined || v === null ? null : Number(v),
                  )
                }
                decimalPlaces={2}
              />
            </FormField>
            <FormField label="原价" help="元/两">
              <InputNumber
                value={draft.pricePerLiang ?? undefined}
                onChange={(v) =>
                  setDraftField(
                    'pricePerLiang',
                    v === undefined || v === null ? null : Number(v),
                  )
                }
                decimalPlaces={2}
              />
            </FormField>
            <FormField label="会员价" help="元/两">
              <InputNumber
                value={draft.memberPricePerLiang ?? undefined}
                onChange={(v) =>
                  setDraftField(
                    'memberPricePerLiang',
                    v === undefined || v === null ? null : Number(v),
                  )
                }
                decimalPlaces={2}
              />
            </FormField>
            <FormField label="米饭价格" className="grid-span-2" help="元/位">
              <InputNumber
                value={draft.ricePrice ?? undefined}
                onChange={(v) =>
                  setDraftField(
                    'ricePrice',
                    v === undefined || v === null ? null : Number(v),
                  )
                }
                decimalPlaces={2}
              />
            </FormField>
          </div>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}
