# Fastfood Kitchen 项目进度报告

报告日期：2026-08-06

## 一、项目概览

快餐厨房智能管理系统 —— 面向**称重式快餐连锁门店**（荤素同价、按两计价）的内部管理平台，覆盖菜品规划、备料管理、成本核算、经营分析全链路，核心是**数据驱动的菜品推荐算法**。

| 端 | 技术栈 | 状态 |
|---|---|---|
| services/api | NestJS 10 + TypeORM 10 + sql.js（可切 Postgres） | 活跃 |
| apps/web-admin | Next.js 14 App Router + TDesign React + Zustand + SWR | 活跃 |
| apps/miniapp | Taro 3.6 WeChat 小程序 + NutUI React | 活跃（构建损坏，见 §四） |
| apps/mobile / apps/web-next / packages/ui / packages/tooling | 占位或实验性骨架 | 未激活 |

角色体系 8 个（admin / chef_manager / chef / prep / breakfast_chef / breakfast_assistant / buyer / store_manager），工位系统（wok / grill_fry_steam / prep / breakfast_wok / breakfast_assist）三端同步。

## 二、Git 状态

- 仓库仅 **2 个提交**（init + .gitignore），当前分支 `main` 与 origin 同步。
- 工作区有**大量未提交改动**：P1 全部功能、PLAN/TASKS 文档等均已提交在 init 提交内，但下列内容**从未入库**：
  - 修改：`package.json` / `package-lock.json`（移除 `@tarojs/react` 可选依赖）
  - 未跟踪：`.npmrc`、`apps/mobile/`、`apps/web-next/`（空骨架，0 个 .tsx）、`packages/domain/`、`packages/tooling/`、`packages/ui/`（仅含 package.json 存根）
- 建议尽快补齐一次「全量基线提交」，避免工作丢失。

## 三、功能完成度

### 3.1 后端（21 个业务模块）

auth、user、store、dish、ingredient、inventory、menu-plan、task、costing、operation-log、audit、supplementary-order（补单）、data-import，以及 P1 新增 9 个模块：daily-metric、dish-feedback、menu-standard、default-dish、algorithm-config、dish-type-tag、menu-pairing-rule、ai、costing 增强。

- 数据库迁移 7 个：初始 schema → v1 功能 → **P1 推荐系统（9 张新表 + Store 新字段）** → 审核记录 → 工位值规范化 → 用户工位 → 补单表。
- P1 推荐算法已实现（`costing.service.ts`）：客单价加成 / 搭配加成 / 历史反馈加成 / 多样性加成 / 分类均衡加成 / 白名单排除 / 4 维度菜单评分 / 参数从 `algorithm_config` 读取 / `reasons` 返回原因说明。

### 3.2 Web Admin（18 个路由）

基础页：dishes、ingredients、inventory、menu-plans、stores、users、operation-logs、audit、data-import、analysis。
P1 新增页全部落地：daily-metrics（每日经营数据）、dish-feedback（菜品反馈）、menu-standards（菜单标准）、default-dishes（默认菜品白名单）、algorithm-config（算法参数）、dish-type-tags（分类标签）、pairing-rules（搭配规则）。

### 3.3 小程序（21 个页面）

登录、菜单规划（含补单、评分、推荐）、菜品详情/编辑、库存、任务、分析、食材、操作日志、人员/门店管理，P1 新增：daily-report（每日填报）、algorithm-config、menu-standard、station、data-import、audit 等。

### 3.4 计划对照

| 计划 | 完成 | 未完成 |
|---|---|---|
| PLAN.md（v1 收尾） | Step 0–5 全部；Step 6 自动化验收 | Step 6 端到端人工验收、小程序真机验收 |
| TASKS-P1.md（P1 推荐系统） | Step 7–13、15 全部标记完成 | T7.11/T14.2 真实 Postgres 迁移验证、T14.7 填报→偏差→次日推荐闭环验证、T14.10 端到端人工验收 |

## 四、本轮实测验证（2026-08-06）

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm run build` | ❌ 退出码 1 | **miniapp Taro 构建失败** |
| `npm run lint` | ❌ 失败 | miniapp 类型错误 + 占位 workspace 缺 tsconfig |
| `npm run test:workspaces` | ✅ 19/19 通过 | API 单元测试 + HTTP CRUD 冒烟 |
| `npm run build --workspace=api` | ✅ | tsc 通过 |
| `npm run build --workspace=web-admin` | ✅ | next build 通过 |

### 具体问题

1. **miniapp 构建损坏**（webpack 版本不兼容）：Taro 3.6.40 调用 `ProgressPlugin` 时传入 `name/color/reporters` 选项，与已解析的 webpack 新版 schema 冲突，`ValidationError` 直接抛错。根因是 hoisted `node_modules` 中 webpack 版本过新，需要 pin webpack 版本或加 npm overrides。
2. **miniapp 类型错误**（`apps/miniapp/src/pages/menu-plan/index.tsx`）：
   - L107：`RecommendationDish`（`src/api/costing.ts`）缺 `expectedMargin` 字段（接口实际返回 `estimatedMargin`）；
   - L146：`readOnly`、`canEditCurrentMeal` 在声明（L157-158）之前被使用——把两行声明上移到使用处即可。
3. **根 lint 被占位 workspace 破坏**：`apps/mobile`、`apps/web-next`、`packages/ui`、`packages/tooling` 的 package.json 带 lint 脚本但无 `tsconfig.json`（TS5058）。这些是保留/实验目录，应从 lint 集合排除或补上 tsconfig。

> 结论：PLAN.md 中「build/lint/test 全绿」的基线（2026-04）已**回归**——miniapp 构建与 lint、根 lint 均不可用，需先修复再进入验收阶段。

## 五、剩余工作清单（按优先级）

1. 修复 miniapp webpack/Taro 构建（阻塞项）
2. 修复 miniapp menu-plan 两处 TS 错误（小改动）
3. 修复根 lint（占位 workspace 排除或补 tsconfig）
4. 全量基线提交（Git 仅 2 个提交，风险高）
5. 真实 Postgres 迁移验证（T7.11/T14.2）
6. 填报闭环验证：填报 → 偏差计算 → 次日推荐调整（T14.7）
7. 端到端业务流人工验收（T14.10 / T6.3）与小程序的微信开发者工具/真机验收（T6.4）

## 六、风险与建议

- **回归风险高**：所有工作堆在一个 init 提交上，任何误操作无法回退；建议立即提交基线并保持小步提交。
- **webpack 依赖治理**：monorepo hoisting 下 Taro 与 webpack 版本冲突是当前最大技术债，建议在根 `overrides` 固定 webpack 版本并记录到 CLAUDE.md。
- **验收依赖人工**：剩余 4 项未完成项全部属于人工验收（Postgres 环境、小程序开发者工具、端到端业务流），自动化无法覆盖，需安排专人执行并留档。
- **web-next 骨架**：与 web-admin 重复的空目录，建议明确去留（删除或标记为实验），避免 lint/构建误伤。
