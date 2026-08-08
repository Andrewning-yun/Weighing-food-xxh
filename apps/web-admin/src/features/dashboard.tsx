import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'tdesign-react/es/button';
import { Tag } from 'tdesign-react/es/tag';
import {
  CalendarIcon,
  ChatIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CutIcon,
  FolderOpenIcon,
  RadishIcon,
  ShopIcon,
  UserIcon,
} from 'tdesign-icons-react';
import {
  fetchDailyMetrics,
  fetchStores,
  getAuditStats,
  listMenuPlans,
  type MenuPlanRecord,
  type StoreRecord,
} from '../lib/api';
import { useAppStore, useHasRole } from '../lib/store';

interface TodoItem {
  title: string;
  desc: string;
  href: string;
  cta: string;
  tone: 'primary' | 'warning' | 'success';
  active: boolean;
  icon: React.ReactElement;
}

const MEAL_LABELS: Record<string, string> = { breakfast: '早餐', lunch: '正餐' };

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function DashboardPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const currentStore = useAppStore((state) => state.currentStore);

  const [menuPlans, setMenuPlans] = useState<MenuPlanRecord[]>([]);
  const [pendingAudit, setPendingAudit] = useState(0);
  const [todayReported, setTodayReported] = useState(false);
  const [busy, setBusy] = useState(true);
  const [stores, setStores] = useState<StoreRecord[]>([]);

  const effectiveStoreId = useMemo(() => {
    return currentStore?.id || user?.storeId || stores[0]?.id || '';
  }, [currentStore, user, stores]);

  const role = user?.role || '';
  const today = toDateStr(new Date());

  const canSeeMenu = useHasRole(['admin', 'chef_manager', 'chef', 'breakfast_chef']);
  const canSeeAudit = useHasRole(['admin', 'store_manager', 'buyer']);
  const canSeeReport = useHasRole(['admin', 'store_manager']);
  const canSeeBaseData = useHasRole(['admin', 'chef_manager', 'buyer', 'store_manager']);
  const canSeeInventory = useHasRole(['admin', 'chef_manager', 'prep', 'store_manager']);
  const canSeeStores = useHasRole(['admin', 'store_manager']);
  const canSeeUsers = useHasRole(['admin', 'chef_manager']);

  useEffect(() => {
    let cancelled = false;

    fetchStores()
      .then((list) => {
        if (!cancelled) setStores(Array.isArray(list) ? list : []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!effectiveStoreId) {
      setBusy(false);
      return;
    }

    (async () => {
      try {
        const [plans, auditStats] = await Promise.all([
          listMenuPlans({ storeId: effectiveStoreId, dateFrom: today, dateTo: today }).catch(() => []),
          canSeeAudit ? getAuditStats(effectiveStoreId).catch(() => null) : Promise.resolve(null),
        ]);

        if (cancelled) return;
        setMenuPlans(Array.isArray(plans) ? plans : []);

        const pending = auditStats?.byStatus?.find((item) => item.status === 'pending')?.count ?? 0;
        setPendingAudit(pending);

        if (canSeeReport) {
          const metrics = await fetchDailyMetrics({
            storeId: effectiveStoreId,
            date: today,
          }).catch(() => []);
          if (!cancelled) setTodayReported(metrics.length > 0);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveStoreId, today, canSeeAudit, canSeeReport]);

  const plansByMeal = useMemo(() => {
    const map: Record<string, MenuPlanRecord | undefined> = {};
    for (const plan of Array.isArray(menuPlans) ? menuPlans : []) {
      map[plan.mealType] = plan;
    }
    return map;
  }, [menuPlans]);

  const todos: TodoItem[] = useMemo(() => {
    const items: TodoItem[] = [];

    if (canSeeMenu) {
      for (const meal of ['breakfast', 'lunch'] as const) {
        const plan = plansByMeal[meal];
        const published = plan?.status === 'published';
        items.push({
          title: published ? `今日${MEAL_LABELS[meal]}已发布` : `今日${MEAL_LABELS[meal]}待定稿`,
          desc: published
            ? `${plan.dishes.length} 道菜品 · 出餐模式生效`
            : plan
              ? `已选 ${plan.dishes.length} 道，尚未发布`
              : '尚未创建菜单计划',
          href: '/menu-plans',
          cta: published ? '查看菜单' : '去定稿',
          tone: published ? 'success' : 'warning',
          active: !published,
          icon: <CalendarIcon />,
        });
      }
    }

    if (canSeeReport) {
      items.push({
        title: todayReported ? '今日经营已填报' : '今日经营未填报',
        desc: todayReported ? '客单价与剩余反馈已记录' : '客单价、人数与天气待录入',
        href: '/daily-metrics',
        cta: todayReported ? '查看日报' : '去填报',
        tone: todayReported ? 'success' : 'warning',
        active: !todayReported,
        icon: <ChartBarIcon />,
      });
    }

    if (canSeeAudit) {
      items.push({
        title: pendingAudit > 0 ? `${pendingAudit} 条变更待审核` : '无待审核变更',
        desc: '早餐角色的菜品修改进入审核队列',
        href: '/audit',
        cta: pendingAudit > 0 ? '去审核' : '查看',
        tone: pendingAudit > 0 ? 'warning' : 'success',
        active: pendingAudit > 0,
        icon: <CheckCircleIcon />,
      });
    }

    return items;
  }, [canSeeMenu, canSeeReport, canSeeAudit, plansByMeal, todayReported, pendingAudit]);

  const quickLinks = useMemo(() => {
    const links: Array<{ label: string; href: string; icon: React.ReactElement }> = [];
    if (canSeeBaseData) {
      links.push({ label: '菜品库', href: '/dishes', icon: <CutIcon /> });
      links.push({ label: '食材库', href: '/ingredients', icon: <RadishIcon /> });
    }
    if (canSeeMenu) links.push({ label: '菜品反馈', href: '/dish-feedback', icon: <ChatIcon /> });
    if (canSeeInventory) links.push({ label: '库存查看', href: '/inventory', icon: <FolderOpenIcon /> });
    if (canSeeStores) links.push({ label: '门店', href: '/stores', icon: <ShopIcon /> });
    if (canSeeUsers) links.push({ label: '员工', href: '/users', icon: <UserIcon /> });
    return links;
  }, [canSeeBaseData, canSeeMenu, canSeeInventory, canSeeStores, canSeeUsers]);

  const pendingCount = todos.filter((item) => item.active).length;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          {currentStore?.name || stores.find((s) => s.id === effectiveStoreId)?.name || '今日概览'}
        </h1>
        <div style={{ color: 'var(--td-text-color-secondary)', fontSize: 13, marginTop: 6 }}>
          {today} · {pendingCount > 0 ? `${pendingCount} 项待办` : '今日事项已全部完成'}
        </div>
      </div>

      {/* 待办区 */}
      {busy ? (
        <div style={{ color: 'var(--td-text-color-placeholder)', padding: '48px 0', textAlign: 'center' }}>
          加载中…
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {todos.map((todo) => (
            <div
              key={todo.title}
              style={{
                border: `1px solid ${todo.active ? 'var(--td-brand-color-light)' : 'var(--td-component-border)'}`,
                borderRadius: 16,
                padding: '20px 20px 16px',
                background: todo.active
                  ? 'var(--td-brand-color-light)'
                  : 'var(--td-bg-color-container)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--td-brand-color)', fontSize: 18 }}>{todo.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{todo.title}</span>
                {todo.active && (
                  <Tag theme="warning" variant="light" size="small">
                    待处理
                  </Tag>
                )}
              </div>
              <div style={{ color: 'var(--td-text-color-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                {todo.desc}
              </div>
              <Button
                theme={todo.active ? 'primary' : 'default'}
                variant={todo.active ? 'base' : 'outline'}
                size="small"
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
                onClick={() => router.push(todo.href)}
              >
                {todo.cta}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 今日菜单概览 */}
      {canSeeMenu && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>今日菜单</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {(['breakfast', 'lunch'] as const).map((meal) => {
              const plan = plansByMeal[meal];
              const published = plan?.status === 'published';
              return (
                <div
                  key={meal}
                  style={{
                    border: '1px solid var(--td-component-border)',
                    borderRadius: 16,
                    padding: '18px 20px',
                    background: 'var(--td-bg-color-container)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>{MEAL_LABELS[meal]}</span>
                    <Tag theme={published ? 'success' : 'warning'} variant="light" size="small">
                      {published ? '已发布' : '草稿'}
                    </Tag>
                  </div>
                  {plan && Array.isArray(plan.dishes) && plan.dishes.length > 0 ? (
                    <div style={{ color: 'var(--td-text-color-secondary)', fontSize: 13, lineHeight: 1.7 }}>
                      {plan.dishes.map((dish) => dish.dishName).join('、')}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--td-text-color-placeholder)', fontSize: 13 }}>暂无菜单计划</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 快捷入口 */}
      {quickLinks.length > 0 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>常用入口</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {quickLinks.map((link) => (
              <Button
                key={link.href}
                variant="outline"
                icon={link.icon}
                onClick={() => router.push(link.href)}
              >
                {link.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
