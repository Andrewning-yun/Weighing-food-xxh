import { ScrollView, Text, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import request from '../../api/request';
import { getActiveStoreId, getActiveStoreName, getSessionUser, hasSession } from '../../utils/session';
import './index.scss';

type Role =
  | 'admin'
  | 'chef_manager'
  | 'chef'
  | 'prep'
  | 'breakfast_chef'
  | 'breakfast_assistant'
  | 'buyer'
  | 'store_manager';

interface StoreRecord {
  id: string;
  name: string;
}

interface StaffRecord {
  id: string;
  username: string;
  name: string;
  role: Role;
  storeId?: string;
  wechatOpenId?: string;
  store?: StoreRecord;
}

interface StaffForm {
  username: string;
  name: string;
  password: string;
  role: Role;
  storeId: string;
  wechatOpenId: string;
}

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: 'chef_manager', label: '厨房主管' },
  { value: 'chef', label: '厨师' },
  { value: 'prep', label: '备料员' },
  { value: 'breakfast_chef', label: '早餐主厨' },
  { value: 'breakfast_assistant', label: '早餐帮工' },
  { value: 'buyer', label: '采购员' },
  { value: 'store_manager', label: '门店经理' },
  { value: 'admin', label: '管理员' },
];

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function createEmptyForm(storeId: string): StaffForm {
  return {
    username: '',
    name: '',
    password: '',
    role: 'chef',
    storeId,
    wechatOpenId: '',
  };
}

function roleLabel(role: Role) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label || role;
}

async function fetchStores() {
  return request<StoreRecord[]>({
    url: '/stores',
    auth: true,
  });
}

async function fetchUsers(storeId: string) {
  return request<StaffRecord[]>({
    url: `/users${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ''}`,
    auth: true,
  });
}

async function createStaff(payload: {
  username: string;
  password: string;
  name: string;
  role: Role;
  storeId?: string;
  wechatOpenId?: string;
}) {
  return request<StaffRecord>({
    url: '/users',
    method: 'POST',
    auth: true,
    data: payload,
  });
}

async function updateStaff(
  id: string,
  payload: Partial<{
    username: string;
    password: string;
    name: string;
    role: Role;
    storeId?: string;
    wechatOpenId?: string;
  }>,
) {
  return request<StaffRecord>({
    url: `/users/${id}`,
    method: 'PATCH',
    auth: true,
    data: payload,
  });
}

export default function StaffManagePage() {
  const user = getSessionUser();
  const role = (user?.role || '') as Role;
  const canManage = role === 'admin' || role === 'chef_manager';
  const currentStoreId = getActiveStoreId(user);
  const currentStoreName = getActiveStoreName(user) || user?.storeName || user?.storeId || '未选择门店';

  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState<StaffForm>(createEmptyForm(currentStoreId));

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    if (!canManage) {
      setBusy(false);
      setMessage('当前角色无权管理员工。');
      return;
    }

    void bootstrap(currentStoreId);
  }, [currentStoreId]);

  async function bootstrap(storeId: string) {
    setBusy(true);
    setMessage('');

    try {
      const [storeData, staffData] = await Promise.all([
        fetchStores().catch(() => [] as StoreRecord[]),
        fetchUsers(storeId).catch(() => [] as StaffRecord[]),
      ]);
      setStores(storeData);
      setStaffList(staffData);
      setForm((prev) => ({ ...prev, storeId: prev.storeId || storeId }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载员工列表失败');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(record: StaffRecord) {
    setEditingId(record.id);
    setForm({
      username: record.username,
      name: record.name,
      password: '',
      role: record.role,
      storeId: record.storeId || currentStoreId,
      wechatOpenId: record.wechatOpenId || '',
    });
  }

  function resetForm() {
    setEditingId('');
    setForm(createEmptyForm(currentStoreId));
  }

  async function handleSave() {
    if (!canManage || saving) {
      return;
    }

    if (!form.username.trim() || !form.name.trim()) {
      setMessage('用户名和姓名不能为空');
      return;
    }

    if (!editingId && form.password.trim().length < 4) {
      setMessage('新建员工时密码至少 4 位');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const payload = {
        username: form.username.trim(),
        name: form.name.trim(),
        role: form.role,
        storeId: form.storeId || undefined,
        wechatOpenId: form.wechatOpenId.trim() || undefined,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      };

      if (editingId) {
        await updateStaff(editingId, payload);
        Taro.showToast({ title: '员工已更新', icon: 'success' });
      } else {
        await createStaff(payload as Parameters<typeof createStaff>[0]);
        Taro.showToast({ title: '员工已创建', icon: 'success' });
      }

      resetForm();
      await bootstrap(currentStoreId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存员工失败');
    } finally {
      setSaving(false);
    }
  }

  const storeChips = useMemo(() => stores.filter((item) => item.id), [stores]);

  return (
    <View className='staff-v2-page'>
      <View className='shell-card sf2-hero'>
        <View>
          <Text className='sf2-eyebrow'>员工管理</Text>
          <Text className='sf2-title'>门店员工</Text>
          <Text className='sf2-subtitle'>当前门店：{currentStoreName}</Text>
        </View>
        <NutButton size='mini' onClick={() => bootstrap(currentStoreId)} loading={busy}>
          刷新
        </NutButton>
      </View>

      {message ? <Text className='sf2-message'>{message}</Text> : null}

      {canManage ? (
        <View className='shell-card sf2-form'>
          <Text className='sf2-section-title'>{editingId ? '编辑员工' : '新建员工'}</Text>
          <NutInput className='sf2-input' placeholder='用户名' value={form.username} onChange={(v) => setForm((prev) => ({ ...prev, username: v }))} />
          <NutInput className='sf2-input' placeholder='姓名' value={form.name} onChange={(v) => setForm((prev) => ({ ...prev, name: v }))} />
          <NutInput
            className='sf2-input'
            type="password"
            placeholder={editingId ? '不修改密码可留空' : '密码'}
            value={form.password}
            onChange={(v) => setForm((prev) => ({ ...prev, password: v }))}
          />
          <ScrollView scrollX className='sf2-chip-scroll'>
            <View className='sf2-chip-row'>
              {ROLE_OPTIONS.map((item) => (
                <Text
                  key={item.value}
                  className={`sf2-chip ${form.role === item.value ? 'sf2-chip-active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, role: item.value }))}
                >
                  {item.label}
                </Text>
              ))}
            </View>
          </ScrollView>
          <ScrollView scrollX className='sf2-chip-scroll'>
            <View className='sf2-chip-row'>
              {storeChips.map((item) => (
                <Text
                  key={item.id}
                  className={`sf2-chip ${form.storeId === item.id ? 'sf2-chip-active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, storeId: item.id }))}
                >
                  {item.name}
                </Text>
              ))}
            </View>
          </ScrollView>
          <NutInput
            className='sf2-input'
            placeholder='微信 OpenID，可留空'
            value={form.wechatOpenId}
            onChange={(v) => setForm((prev) => ({ ...prev, wechatOpenId: v }))}
          />
          <View className='sf2-actions'>
            <NutButton onClick={resetForm}>清空</NutButton>
            <NutButton type='primary' loading={saving} onClick={handleSave}>
              保存
            </NutButton>
          </View>
        </View>
      ) : null}

      {busy ? <View className='shell-card sf2-loading'>正在加载员工...</View> : null}

      {!busy ? (
        <View className='sf2-list'>
          {staffList.length === 0 ? (
            <View className='shell-card sf2-empty'>当前门店还没有员工记录。</View>
          ) : null}

          {staffList.map((item) => (
            <View key={item.id} className='shell-card sf2-card'>
              <View className='sf2-card-head'>
                <View>
                  <Text className='sf2-card-name'>{item.name}</Text>
                  <Text className='sf2-card-meta'>@{item.username}</Text>
                </View>
                <Text className='sf2-badge'>{roleLabel(item.role)}</Text>
              </View>
              <Text className='sf2-line'>门店：{item.store?.name || item.storeId || '未绑定'}</Text>
              <Text className='sf2-line'>OpenID：{item.wechatOpenId || '未绑定'}</Text>
              {canManage ? (
                <View className='sf2-actions'>
                  <NutButton size='mini' onClick={() => startEdit(item)}>
                    编辑
                  </NutButton>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
