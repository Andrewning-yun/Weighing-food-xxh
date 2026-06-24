import { ScrollView, Text, View } from '@tarojs/components';
import { Button as NutButton } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import TabBar from '../../components/TabBar';
import { fetchTasks, generateTasksFromMenu, updateTask, type Task } from '../../api/task';
import { formatRoleLabel, getActiveStoreId, getSessionUser, hasSession } from '../../utils/session';
import { canAccessPage, isReadOnly } from '../../utils/role-guard';
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
type MealTab = 'breakfast' | 'lunch';
type TaskStatus = 'pending' | 'in_progress' | 'completed';

interface DateItem {
  value: string;
  label: string;
  weekday: string;
  isToday: boolean;
}

type TaskCard = Task & {
  assignedTo?: string;
  source?: string;
  completedBy?: string;
  items?: Array<{ ingredientId: string; name?: string; quantity: number; unit: string }>;
};

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildRecentDates(): DateItem[] {
  const today = new Date();
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const value = toDateStr(date);
    return {
      value,
      label: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`,
      weekday: labels[date.getDay()],
      isToday: value === toDateStr(today),
    };
  });
}

function getMealLabel(mealType: MealTab): string {
  return mealType === 'breakfast' ? '早餐' : '正餐';
}

function getStatusLabel(status?: TaskStatus): string {
  if (status === 'in_progress') return '进行中';
  if (status === 'completed') return '已完成';
  return '待处理';
}

function getStatusNext(status?: TaskStatus): TaskStatus {
  if (status === 'pending') return 'in_progress';
  if (status === 'in_progress') return 'completed';
  return 'in_progress';
}

function canOperateTask(role: Role, task: TaskCard, userId: string): boolean {
  if (isReadOnly(role)) return false;
  if (role === 'admin') return true;
  if (role === 'chef_manager') return task.mealType === 'lunch';
  if (role === 'breakfast_chef' || role === 'breakfast_assistant') return task.mealType === 'breakfast';
  if (role === 'prep') {
    const assignedTo = task.assignedTo || (task as Task & { assigneeId?: string }).assigneeId || '';
    return !assignedTo || assignedTo === userId;
  }
  return canAccessPage(role, 'tasks');
}

export default function TasksPage() {
  const [busy, setBusy] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [mealTab, setMealTab] = useState<MealTab>('lunch');
  const [tasks, setTasks] = useState<TaskCard[]>([]);

  const recentDates = useMemo(() => buildRecentDates(), []);

  const user = getSessionUser();
  const role = (user?.role || '') as Role;
  const storeId = getActiveStoreId(user);
  const userId = user?.id || '';
  const readOnly = isReadOnly(role);
  const canGenerate = (role === 'admin' || role === 'chef_manager') && !readOnly;

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    if (!storeId) {
      setBusy(false);
      setMessage('当前账号未绑定门店，无法查看任务。');
      return;
    }

    void loadTasks();
  }, [selectedDate, mealTab]);

  async function loadTasks() {
    setBusy(true);
    setMessage('');

    try {
      const data = await fetchTasks({
        storeId,
        date: selectedDate,
        mealType: mealTab,
      });
      setTasks(data as TaskCard[]);
    } catch (error) {
      setTasks([]);
      setMessage(error instanceof Error ? error.message : '加载任务失败。');
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateFromMenu() {
    if (!canGenerate || readOnly) return;
    setGenerating(true);
    setMessage('');

    try {
      await generateTasksFromMenu({
        storeId,
        date: selectedDate,
        mealType: mealTab,
      });
      await loadTasks();
      setMessage('已根据菜单生成任务。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '生成任务失败。');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSwitchStatus(task: TaskCard) {
    if (!canOperateTask(role, task, userId)) return;

    const nextStatus = getStatusNext(task.status as TaskStatus | undefined);
    const assignedTo = role === 'prep' ? userId : task.assignedTo || (task as Task & { assigneeId?: string }).assigneeId;

    setSavingTaskId(task.id);
    setMessage('');

    try {
      await updateTask(task.id, {
        status: nextStatus,
        ...(assignedTo ? { assignedTo } : {}),
      });
      await loadTasks();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '更新任务状态失败。');
    } finally {
      setSavingTaskId('');
    }
  }

  const filteredTasks = useMemo(() => tasks, [tasks]);
  const counts = useMemo(() => {
    return {
      pending: filteredTasks.filter((task) => task.status === 'pending').length,
      progress: filteredTasks.filter((task) => task.status === 'in_progress').length,
      done: filteredTasks.filter((task) => task.status === 'completed').length,
    };
  }, [filteredTasks]);

  const emptyStateCopy = canGenerate
    ? '这个餐别还没有任务，可以根据当前菜单自动生成。'
    : '当前没有任务。';

  return (
    <View className='screen tasks-screen'>
      <View className='tasks-hero'>
        <View>
          <Text className='tasks-eyebrow'>任务看板</Text>
          <Text className='tasks-title'>任务系统</Text>
          <Text className='tasks-subtitle'>{user?.storeName || user?.storeId || '未绑定门店'}</Text>
        </View>
        <View className='tasks-role'>
          <Text className='tasks-role-text'>{formatRoleLabel(role)}</Text>
        </View>
      </View>

      <View className='tasks-kpi-row'>
        <View className='tasks-kpi-card'>
          <Text className='tasks-kpi-value'>{counts.pending}</Text>
          <Text className='tasks-kpi-label'>待处理</Text>
        </View>
        <View className='tasks-kpi-card'>
          <Text className='tasks-kpi-value'>{counts.progress}</Text>
          <Text className='tasks-kpi-label'>进行中</Text>
        </View>
        <View className='tasks-kpi-card'>
          <Text className='tasks-kpi-value'>{counts.done}</Text>
          <Text className='tasks-kpi-label'>已完成</Text>
        </View>
      </View>

      <View className='tasks-toolbar'>
        <View className='tasks-meal-tabs'>
          <View className={`tasks-tab ${mealTab === 'breakfast' ? 'tasks-tab-active' : ''}`} onClick={() => setMealTab('breakfast')}>
            <Text className='tasks-tab-text'>早餐</Text>
          </View>
          <View className={`tasks-tab ${mealTab === 'lunch' ? 'tasks-tab-active' : ''}`} onClick={() => setMealTab('lunch')}>
            <Text className='tasks-tab-text'>正餐</Text>
          </View>
        </View>
        {canGenerate ? (
          <NutButton className='tasks-generate-btn' size='mini' loading={generating} onClick={handleGenerateFromMenu}>
            从菜单生成任务
          </NutButton>
        ) : null}
      </View>

      <ScrollView scrollX>
        <View className='tasks-date-scroll'>
          {recentDates.map((item) => (
            <View
              key={item.value}
              className={`tasks-date-item ${selectedDate === item.value ? 'tasks-date-active' : ''}`}
              onClick={() => setSelectedDate(item.value)}
            >
              <Text className='tasks-date-weekday'>{item.weekday}</Text>
              <Text className='tasks-date-label'>{item.label}</Text>
              {item.isToday ? <Text className='tasks-date-dot' /> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <View className='tasks-summary'>
        <Text className='tasks-summary-text'>
          {selectedDate} 路 {getMealLabel(mealTab)} 路 共 {filteredTasks.length} 项
        </Text>
      </View>

      {message ? <Text className='tasks-message'>{message}</Text> : null}

      {busy ? (
        <View className='tasks-loading'>
          <Text className='tasks-loading-text'>正在加载任务...</Text>
        </View>
      ) : null}

      {!busy && filteredTasks.length === 0 ? (
        <View className='tasks-empty'>
          <Text className='tasks-empty-title'>暂无任务</Text>
          <Text className='tasks-empty-text'>{emptyStateCopy}</Text>
        </View>
      ) : null}

      {!busy && filteredTasks.length > 0 ? (
        <View className='tasks-list'>
          {filteredTasks.map((task) => {
            const assignedTo = task.assignedTo || (task as Task & { assigneeId?: string }).assigneeId || '';
            const canOperate = canOperateTask(role, task, userId);
            const taskStatus = task.status as TaskStatus | undefined;
            const nextStatus = getStatusNext(taskStatus);

            return (
              <View key={task.id} className='tasks-card'>
                <View className='tasks-card-top'>
                  <View className='tasks-card-body'>
                    <Text className='tasks-card-title'>{task.title || '未命名任务'}</Text>
                    <Text className='tasks-card-meta'>
                      {getMealLabel(task.mealType as MealTab)} 路 {task.date}
                    </Text>
                  </View>
                  <Text className={`tasks-status tasks-status-${taskStatus || 'pending'}`}>
                    {getStatusLabel(taskStatus)}
                  </Text>
                </View>

                <View className='tasks-card-grid'>
                  <View className='tasks-card-meta-item'>
                    <Text className='tasks-card-meta-label'>来源</Text>
                    <Text className='tasks-card-meta-value'>{task.source || '手动创建'}</Text>
                  </View>
                  <View className='tasks-card-meta-item'>
                    <Text className='tasks-card-meta-label'>负责人</Text>
                    <Text className='tasks-card-meta-value'>{assignedTo || '未分配'}</Text>
                  </View>
                  <View className='tasks-card-meta-item'>
                    <Text className='tasks-card-meta-label'>完成人</Text>
                    <Text className='tasks-card-meta-value'>{task.completedBy || '未完成'}</Text>
                  </View>
                  <View className='tasks-card-meta-item'>
                    <Text className='tasks-card-meta-label'>条目</Text>
                    <Text className='tasks-card-meta-value'>{task.items?.length || 0}</Text>
                  </View>
                </View>

                {task.items?.length ? (
                  <View className='tasks-item-list'>
                    {task.items.slice(0, 3).map((item) => (
                      <View key={`${task.id}-${item.ingredientId}`} className='tasks-item-chip'>
                        <Text className='tasks-item-name'>{item.name || item.ingredientId}</Text>
                        <Text className='tasks-item-qty'>
                          {item.quantity} {item.unit}
                        </Text>
                      </View>
                    ))}
                    {task.items.length > 3 ? <Text className='tasks-item-more'>还有 {task.items.length - 3} 项</Text> : null}
                  </View>
                ) : null}

                {canOperate ? (
                  <View className='tasks-card-actions'>
                    <NutButton
                      size='mini'
                      className='tasks-action-btn'
                      loading={savingTaskId === task.id}
                      onClick={() => handleSwitchStatus(task)}
                    >
                      {taskStatus === 'pending'
                        ? '开始处理'
                        : taskStatus === 'in_progress'
                          ? `完成为 ${getStatusLabel(nextStatus)}`
                          : '重新处理'}
                    </NutButton>
                  </View>
                ) : (
                  <Text className='tasks-readonly-hint'>
                    {role === 'prep'
                      ? '备料员只能操作分配给自己的任务'
                      : role === 'breakfast_chef' || role === 'breakfast_assistant'
                        ? '早餐角色只能操作早餐任务'
                        : '当前角色没有编辑权限'}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ) : null}

      <TabBar current='tasks' />
    </View>
  );
}
