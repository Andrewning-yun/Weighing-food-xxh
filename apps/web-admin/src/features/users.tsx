import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Button from 'tdesign-react/es/button';
import Input from 'tdesign-react/es/input';
import Select from 'tdesign-react/es/select';
import Dialog from 'tdesign-react/es/dialog';
import Space from 'tdesign-react/es/space';
import { fetchStores, type StoreRecord } from '../lib/api';
import {
  DEFAULT_USER_PASSWORD,
  Station,
  WEB_ADMIN_DEFAULT_API_BASE_URL,
  WEB_ADMIN_TOKEN_KEY,
} from '../../../../packages/config/index';
import { DataTable, type Column } from '../components/data-table';
import { showDeleteConfirm } from '../components/delete-confirm-dialog';
import { toast } from '../lib/toast';
import { formatDateTime } from '../lib/format';

type UserRole =
  | 'admin' | 'chef_manager' | 'chef' | 'prep'
  | 'breakfast_chef' | 'breakfast_assistant' | 'buyer' | 'store_manager';

interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  station?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  wechatOpenId?: string | null;
  updatedAt?: string;
}

interface UserDraft {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  station: string;
  storeId: string;
  wechatOpenId: string;
  password: string;
}

const API_BASE_URL = WEB_ADMIN_DEFAULT_API_BASE_URL;

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: '管理员' },
  { value: 'chef_manager', label: '厨房主管' },
  { value: 'chef', label: '厨师' },
  { value: 'prep', label: '备料' },
  { value: 'breakfast_chef', label: '早餐主厨' },
  { value: 'breakfast_assistant', label: '早餐帮工' },
  { value: 'buyer', label: '采购' },
  { value: 'store_manager', label: '门店经理' },
];

const STATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: '不限工位' },
  { value: Station.WOK, label: '炒锅' },
  { value: Station.GRILL_FRY_STEAM, label: '煎扒蒸菜' },
  { value: Station.PREP, label: '切配' },
  { value: Station.BREAKFAST_WOK, label: '早餐炒锅' },
  { value: Station.BREAKFAST_ASSIST, label: '早餐副手' },
];

const EMPTY_USER: UserDraft = {
  username: '',
  name: '',
  role: 'chef',
  station: '',
  storeId: '',
  wechatOpenId: '',
  password: '',
};

function getToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(WEB_ADMIN_TOKEN_KEY) || '';
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${getToken()}`);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Request failed (${response.status})`);
  if (!text.trim()) return undefined as T;
  const parsed = JSON.parse(text) as T | { data?: T };
  if (parsed && typeof parsed === 'object' && 'data' in parsed && (parsed as { data?: T }).data !== undefined) {
    return (parsed as { data: T }).data;
  }
  return parsed as T;
}

async function fetchUsers(): Promise<UserRecord[]> {
  return requestJson<UserRecord[]>('/users');
}

async function saveUser(draft: UserDraft): Promise<UserRecord> {
  const payload = {
    username: draft.username.trim(),
    name: draft.name.trim(),
    role: draft.role,
    station: draft.station || undefined,
    storeId: draft.storeId || undefined,
    wechatOpenId: draft.wechatOpenId.trim() || undefined,
    password: draft.password.trim() || (!draft.id ? DEFAULT_USER_PASSWORD : undefined),
  };
  const path = draft.id ? `/users/${draft.id}` : '/users';
  const method = draft.id ? 'PATCH' : 'POST';
  return requestJson<UserRecord>(path, { method, body: JSON.stringify(payload) });
}

async function removeUser(id: string): Promise<void> {
  await requestJson<void>(`/users/${id}`, { method: 'DELETE' });
}

function normalizeUserRecord(record: UserRecord): UserRecord {
  return {
    ...record,
    name: record.name || record.username,
    storeId: record.storeId || null,
    storeName: record.storeName || null,
    wechatOpenId: record.wechatOpenId || null,
  };
}

function createDraftFromRecord(record: UserRecord): UserDraft {
  return {
    id: record.id,
    username: record.username,
    name: record.name,
    role: record.role,
    station: record.station || '',
    storeId: record.storeId || '',
    wechatOpenId: record.wechatOpenId || '',
    password: '',
  };
}

function getRoleLabel(role: UserRole) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label || role;
}

const COLUMNS: Column<UserRecord>[] = [
  { colKey: 'username', title: '用户名', searchable: true },
  { colKey: 'name', title: '姓名', searchable: true },
  { colKey: 'role', title: '角色', cell: ({ row }) => getRoleLabel(row.role) },
  { colKey: 'station', title: '工位', cell: ({ row }) => STATION_OPTIONS.find((o) => o.value === row.station)?.label || row.station || '-' },
  { colKey: 'storeName', title: '门店', cell: ({ row }) => row.storeName || row.storeId || '-' },
  { colKey: 'wechatOpenId', title: '微信OpenID', cell: ({ row }) => row.wechatOpenId || '-' },
  { colKey: 'updatedAt', title: '更新时间', cell: ({ row }) => formatDateTime(row.updatedAt) },
];

export function UsersPage() {
  const { data: rawUsers = [], isLoading, mutate } = useSWR('users', fetchUsers);
  const { data: stores = [] } = useSWR('users-stores', fetchStores);

  const items = useMemo(() => rawUsers.map(normalizeUserRecord), [rawUsers]);
  const storeNameById = useMemo(() => new Map(stores.map((s) => [s.id, s.name])), [stores]);
  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<UserDraft>(EMPTY_USER);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setDraft(EMPTY_USER);
    setDialogOpen(true);
  }

  function openEdit(record: UserRecord) {
    setDraft(createDraftFromRecord(record));
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!draft.username.trim() || !draft.name.trim()) {
      toast.warning('用户名和姓名不能为空');
      return;
    }
    setSaving(true);
    try {
      await saveUser(draft);
      await mutate();
      toast.success(draft.id ? '用户已更新' : '用户已创建');
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存用户失败');
    } finally {
      setSaving(false);
    }
  }

  function handleRemove(record: UserRecord) {
    showDeleteConfirm({
      title: '确认删除用户',
      content: `确定要删除用户「${record.name || record.username}」吗？`,
      onConfirm: async () => {
        await removeUser(record.id);
        await mutate();
        toast.success('用户已删除');
      },
    });
  }

  const actionCell = ({ row }: { row: UserRecord }) => (
    <Space>
      <Button size="small" variant="outline" onClick={() => openEdit(row)}>编辑</Button>
      <Button size="small" theme="danger" variant="outline" onClick={() => handleRemove(row)}>删除</Button>
    </Space>
  );

  const allColumns: Column<UserRecord>[] = [
    ...COLUMNS,
    { colKey: 'action', title: '操作', width: 160, cell: actionCell },
  ];

  return (
    <div className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button theme="primary" onClick={openCreate}>新建用户</Button>
      </div>

      <DataTable<UserRecord>
        columns={allColumns}
        data={items}
        loading={isLoading}
        rowKey="id"
        searchPlaceholder="搜索用户名、姓名、角色..."
        emptyText="暂无用户数据"
        emptyDescription={'点击"新建用户"按钮添加用户'}
        pageSize={15}
      />

      <Dialog
        visible={dialogOpen}
        onClose={() => setDialogOpen(false)}
        header={draft.id ? '编辑用户' : '新建用户'}
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
            <span>用户名</span>
            <Input value={draft.username} onChange={(v) => setDraft((cur) => ({ ...cur, username: v as string }))} placeholder="登录账号" />
          </label>
          <label>
            <span>姓名</span>
            <Input value={draft.name} onChange={(v) => setDraft((cur) => ({ ...cur, name: v as string }))} placeholder="显示名称" />
          </label>
          <label>
            <span>角色</span>
            <Select value={draft.role} onChange={(v) => setDraft((cur) => ({ ...cur, role: v as UserRole }))} options={ROLE_OPTIONS} clearable={false} />
          </label>
          <label>
            <span>工位</span>
            <Select value={draft.station} onChange={(v) => setDraft((cur) => ({ ...cur, station: v as string }))} options={STATION_OPTIONS} clearable={false} />
          </label>
          <label>
            <span>门店绑定</span>
            <Select value={draft.storeId} onChange={(v) => setDraft((cur) => ({ ...cur, storeId: v as string }))} options={[{ value: '', label: '未绑定' }, ...storeOptions]} clearable={false} />
          </label>
          <label>
            <span>微信 OpenID</span>
            <Input value={draft.wechatOpenId} onChange={(v) => setDraft((cur) => ({ ...cur, wechatOpenId: v as string }))} placeholder="可选填写" />
          </label>
          <label>
            <span>密码</span>
            <Input type="password" value={draft.password} onChange={(v) => setDraft((cur) => ({ ...cur, password: v as string }))} placeholder={draft.id ? '留空表示保持当前密码' : '留空则使用系统默认密码'} />
          </label>
        </div>
      </Dialog>
    </div>
  );
}
