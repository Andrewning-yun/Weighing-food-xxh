# Fastfood Kitchen 剩余开发与验收计划

生成日期：2026-04-12  
更新日期：2026-04-13

## 当前状态

### 基线
- `npm.cmd run build`：通过
- `npm.cmd run lint`：通过
- `npm.cmd run test`：通过

### 步骤进度
| 步骤 | 状态 | 说明 |
| --- | --- | --- |
| Step 0 编译阻塞修复 | 已完成 | SWC / Rollup 原生依赖、旧枚举引用、Web Admin 占位页入口均已修复 |
| Step 1 后端修复与 operation-log 集成 | 已完成 | 任务生成食材名补齐，日志链路可用，API 运行时依赖注入已补齐 |
| Step 2 共享包评估与补齐 | 已完成 | `packages/config` 与 `packages/api-client` 已对齐 8 角色与新增字段 |
| Step 3 小程序占位页实现 | 已完成 | 6 个页面均已落地 |
| Step 4 小程序已有页面修复 | 已完成 | 菜单发布、权重显示、库存编辑/新建分流已完成 |
| Step 5 Web Admin 页面补齐 | 已完成 | `inventory` / `menu-plans` / `operation-logs` 已可用，`users` / `ingredients` 已对齐新模型 |
| Step 6 集成验收 | 部分完成 | 自动化构建、lint、test、后端冒烟已完成；端到端人工验收仍待执行 |

## 本轮完成内容

### 后端
- `task.service.ts` 在 `generateFromMenu()` 中注入 `Ingredient` 仓库，生成任务时按 `ingredientId` 回填 `TaskItem.name`
- `dish / ingredient / store / user / menu-plan / inventory` 服务已统一接入 `OperationLogService`
- `ingredient.service.ts` 的更新日志摘要明确包含“已触发菜品成本重算”
- 修复了 request-scope service 的 Nest 运行时依赖注入：相关 module 已补齐 `User` / `Ingredient` 的 `TypeOrmModule.forFeature(...)`

### 共享包
- `packages/config` 由旧三角色 UI 模型升级为与后端一致的 8 角色映射
- `packages/api-client` 补齐 ingredient / dish / user 的新增字段类型

### 小程序
- `pages/menu-plan/index.tsx`
  - 增加菜单发布按钮
  - 发布后刷新状态
  - 权重星标与标签改为基于 `dish.recommendWeight`
- `pages/inventory/index.tsx`
  - 已有记录时走 `updateInventory`
  - 无记录时走 `createInventory`
  - 页面显示当前是新建还是编辑模式，以及已有记录时间

### Web Admin
- `pages/inventory.tsx`：按门店与日期查看库存，按分类分组展示
- `pages/operation-logs.tsx`：支持门店、模块、操作人、时间筛选与分页查看
- `pages/ingredients.tsx`：补齐 `category / perishable / type`
- `pages/users.tsx`：保持 8 角色与门店绑定能力
- `pages/menu-plans.tsx`：已具备早餐/正餐切换、日期选择、菜品增删与发布

## 已完成验收

### 自动化验收
- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build --workspace=api`
- `npm.cmd run build --workspace=web-admin`
- `npm.cmd run lint --workspace=miniapp`
- `npm.cmd run lint --workspace=web-admin`

### 后端冒烟
- 成功启动 `api`
- 使用种子管理员账号登录并完成真实接口验证
- 修改一道菜后，`operation_logs` 中出现 `module=dish`、`action=update`，且包含 `before/after`
- 修改一个食材价格后，`operation_logs` 中出现 `module=ingredient`、`action=update`，摘要包含成本重算信息
- 食材改价后，相关菜品成本仍可正常查询
- 调用 `POST /tasks/generate-from-menu` 后，生成任务的 `items[].name` 非空

## 待人工执行的验收

### 端到端业务流
- admin 登录并创建门店、员工、食材、菜品
- prep 填库存
- breakfast_chef 创建早餐菜单
- chef_manager 查看早餐菜单只读并创建正餐菜单
- store_manager 只读验证
- admin 查看操作日志

### 小程序真机 / 开发者工具
- 14 个页面可访问
- 角色权限与只读限制符合预期
- 核心流程交互正常
