# Fastfood Kitchen 任务清单

生成日期：2026-04-12  
更新日期：2026-04-13

状态标记：`[x]` 已完成，`[ ]` 待执行，`[~]` 进行中

## Step 0 编译阻塞修复

- T0.1 修复 miniapp SWC bindings 问题
- T0.2 修复 API 旧枚举引用错误
- T0.3 修复 Web Admin 缺失页面入口
- T0.4 完成全量 build / lint / test 基线验证

## Step 1 后端修复与 operation-log 集成

- T1.1 移除 `task.controller.ts` 中的 `globalThis` request hack，改为 `@Req()`
- T1.2 在 `task.service.ts` 中补齐自动生成任务的食材名称
- T1.3 `dish.service.ts` 接入 operation-log
- T1.4 `ingredient.service.ts` 接入 operation-log，并记录成本重算链路
- T1.5 `store.service.ts` 接入 operation-log
- T1.6 `user.service.ts` 接入 operation-log
- T1.7 `menu-plan.service.ts` 接入 operation-log
- T1.8 `inventory.service.ts` 接入 operation-log
- T1.9 完成后端 operation-log 冒烟验证

## Step 2 共享包评估

- T2.1 评估并补齐 `packages/config/index.ts`
- T2.2 评估并补齐 `packages/api-client/index.ts`

## Step 3 小程序占位页实现

- T3.1 `pages/tasks/index.tsx`
- T3.2 `pages/analysis/index.tsx`
- T3.3 `pages/ingredients/index.tsx`
- T3.4 `pages/operation-log/index.tsx`
- T3.5 `pages/staff-manage/index.tsx`
- T3.6 `pages/store-manage/index.tsx`

## Step 4 小程序已有页面修复

- T4.1 修复 `pages/menu-plan/index.tsx`
- T4.2 修复 `pages/inventory/index.tsx`

## Step 5 Web Admin 页面补齐

- T5.1 完成 `pages/inventory.tsx`
- T5.2 完成 `pages/menu-plans.tsx`
- T5.3 完成 `pages/operation-logs.tsx`
- T5.4 更新 `pages/users.tsx` 为 8 角色 + 门店绑定
- T5.5 更新 `pages/ingredients.tsx` 为含 `category / perishable / type`

## Step 6 集成验收

- T6.1 全量 build / lint / test 验证
- T6.2 后端冒烟验证
- T6.3 端到端业务流人工验收
- T6.4 小程序微信开发者工具 / 真机人工验收