# Fastfood Kitchen P2 落地方案：菜单管理上线 + 采购闭环

生成日期：2026-08-06

## 背景与目标

称重式快餐门店（荤素同价、按两计价、米饭另计）的内部管理平台。P1 已完成推荐算法与经营数据反馈体系，但存在三项落地阻碍：

1. **构建基线回归**：miniapp Taro 构建损坏（webpack 版本冲突）、lint 失败 —— 本轮已修复（见 §3）
2. **数据失真**：食材价格全为 0，成本/毛利/推荐算法全部失真 —— 上线前必须真实化
3. **采购空白**：仅 `ingredient.supplier` 字段 + 库存表，无采购需求、采购单、收货、价格历史

**落地策略**（与业务方确认）：
- 先服务**菜单管理**场景，第一批门店上线跑通
- 采购按**完整闭环**设计：需求 → 采购单 → 收货
- 数据库 **PostgreSQL**，部署 **云服务器**

## 一、P0 基线修复（已完成 ✅）

| 项 | 修复内容 |
|---|---|
| miniapp 构建 | 根 `package.json` 固定 `webpack@5.91.0`（>5.100 移除了 ProgressPlugin 的 `name/color/reporters` 参数，与 Taro 3.6.40 的 webpackbar 冲突）；miniapp devDependencies 同步钉住 5.91.0 |
| 共享包转译 | miniapp 改用包名导入 `@fastfood-kitchen/config`（原相对路径直接引 TS 源码）；`config/index.ts` 中 `webpackChain` 给 `script` 规则追加 `fastfood-kitchen` include（Taro 3.6.40 的 `compile.include` 配置被 service 白名单过滤，不生效） |
| miniapp lint | `menu-plan/index.tsx`：`expectedMargin` → `estimatedMargin`（类型字段名不符）；`readOnly/canEditCurrentMeal` 声明上移（先使用后声明） |
| 根 lint | 占位 workspace（`apps/mobile`、`apps/web-next`、`packages/ui`、`packages/tooling`）无代码可 lint，移除其 lint 脚本 |
| 基线验证 | `npm run build` ✅、`npm run lint` ✅、`npm run test` ✅（19/19） |

## 二、P1 菜单管理落地（首批上线）

### 2.1 数据真实化（前置条件）

- [ ] T-P1.1 录入 273 种食材的真实采购价（data-import 批量导入，或人工录入）
- [ ] T-P1.2 补全 118 道菜的 BOM（食材用量），使 `ingredientCost` / `grossMargin` 有真实计算基础
- [ ] T-P1.3 门店基础设置：`pricePerLiang`（按两单价）、`ricePrice`、目标客单价（早/正餐）
- [ ] T-P1.4 验证：改食材价 → 菜品成本自动重算 → 推荐排序含毛利维度且数字合理

### 2.2 菜单管理日常闭环

- [ ] T-P1.5 明确主入口：厨师长每日用 **web-admin**（推荐 + 评分 + 发布），店长用 **小程序** 填经营数据与剩余反馈
- [ ] T-P1.6 试点门店跑 2 周日常：菜单计划 → 发布 → 出餐补单 → 剩余反馈 → 次日推荐调整（闭环验证，补上 T14.7）
- [ ] T-P1.7 依据试点反馈调整：菜单标准、搭配规则、算法参数默认值

### 2.3 验收

- [ ] A-P1.1 端到端业务流人工验收（对应 T14.10）：admin 建门店/员工/食材/菜品 → prep 填库存 → breakfast_chef 早餐菜单 → chef_manager 正餐菜单 → store_manager 只读 → admin 看日志
- [ ] A-P1.2 小程序开发者工具/真机验收（对应 T6.4）
- [ ] A-P1.3 成本链路抽查：随机 10 道菜的成本与毛利在合理区间

## 三、P2 采购完整闭环（菜单跑顺后实施）

### 3.1 数据模型（新增 3 张表）

```
purchase_order           采购单
  id, storeId, date, status(draft/submitted/received/cancelled),
  supplierName, totalAmount, createdBy, receivedAt

purchase_order_item      采购单明细
  id, orderId, ingredientId, ingredientName, unit,
  plannedQty(建议量), orderQty, price, receivedQty(实际收货), receivedPrice

purchase_price_history   价格留痕
  id, storeId, ingredientId, price, unit, sourceOrderId, recordedAt
```

### 3.2 核心流程：菜单计划 → 采购需求

```
已发布的菜单计划(近 N 天汇总)
        │
        ▼
按 BOM 反算每日食材需求（用量×份数）
        │
        ▼
需求 - 现有库存 - 在途采购 = 建议采购量
        │
        ▼
生成采购草稿单（可手工调整数量/供应商/单价）
        │
        ▼
提交采购单 ──► 收货入库（实际数量/价格，差异可录）
        │              │
        ▼              ▼
  价格留痕        库存更新 + 成本回写（实时毛利）
```

- 需求反算与库存扣减为**建议量**，采购员可改——系统不强制
- 收货时价格写入 `purchase_price_history`，同时更新食材成本（沿用现有成本重算链路）
- 采购单支持**多供应商**（按明细维度记录供应商）

### 3.3 接口设计

```
GET    /purchase-orders?storeId=&date=&status=      查询
POST   /purchase-orders                             创建草稿（可带 items）
GET    /purchase-orders/:id                         详情
PUT    /purchase-orders/:id                         更新（仅 draft）
POST   /purchase-orders/:id/submit                  提交
POST   /purchase-orders/:id/receive                 收货（items 实际数量/价格）
DELETE /purchase-orders/:id                         撤销（仅 draft）

GET    /purchase-orders/demand?storeId=&startDate=&endDate=
       菜单计划反算的需求汇总（含建议采购量，按食材聚合）

GET    /purchase-price-history?storeId=&ingredientId=&startDate=&endDate=
       价格历史查询（为价格趋势/比价打基础）
```

### 3.4 前端

| 端 | 页面/改动 |
|---|---|
| web-admin | 采购单列表 + 新建/编辑（草稿态）；采购需求汇总页（菜单反算结果）；收货操作页；价格历史查询页 |
| miniapp | 采购员「待处理需求」入口：查看建议采购量 → 确认生成采购单；收货扫码/数量录入（第二期）；首页未收货提醒 |

### 3.5 权限

- 创建/编辑草稿：buyer、admin
- 提交/收货：buyer、admin
- 查看：buyer、chef_manager、store_manager、admin
- 价格历史写入：随收货自动落库（审计日志同步）

### 3.6 验收

- [ ] A-P2.1 需求反算正确性：固定菜单组合下，人工核算 vs 系统建议量一致
- [ ] A-P2.2 收货闭环：收货后库存增加、成本更新、价格入历史、毛利随成本变化
- [ ] A-P2.3 采购单状态流转（draft → submitted → received）与权限校验
- [ ] A-P2.4 补单/临时加菜不影响已生成采购单（快照制：采购单按生成时菜单快照计算）

## 四、部署与数据库（PostgreSQL + 云服务器）

- [ ] T-D1 云服务器安装 PostgreSQL 16 + 创建数据库/账号，配置 `services/api/.env`（本地验证已完成，云服务器执行）
- [x] T-D2 跑通全部迁移（7 个历史 + 1 个 schema 对齐），完成 T7.11/T14.2 —— **2026-08-06 本机 Docker Postgres 16 验证通过**
- [x] T-D2.1 修复 `data-source.ts` 未注册的 3 个迁移（normalize-station-values / add-user-station / create-supplementary-order）
- [x] T-D2.2 修复迁移与实体 schema 漂移：`dish.ingredientCost`（standardCost 改名未跟随）、`algorithm_config.recommendLimit`、`ai_suggestions.appliedAt` 类型、`reportedBy/completedBy/storeId/operatedBy` 类型（uuid↔varchar）→ 新增迁移 `20260806000000-align-schema-with-entities`
- [x] T-D2.3 `data-source.ts` 加载 .env（`import '../env'`），typeorm CLI 与 app 行为一致
- [x] T-D2.4 Postgres 全量接口冒烟：登录/门店/食材/菜品/推荐/菜单计划/反馈/经营数据/菜单评分 11 项通过
- [x] T-D2.5 修复 `menu-score` 漏传 dishes 时 500（`input.dishes ?? []`）
- [x] T-D3 生产部署产物：`docker-compose.yml`（postgres+api+web-admin）、两个 Dockerfile、`deploy/nginx.conf`、`.env.example` 生产配置段；`docs/production-deployment.md` 已更新为 P2 版（compose 语法已验证）
- [ ] T-D4 miniapp 发布准备：**微信小程序备案 + 业务域名 HTTPS 配置**（周期最长的外部流程，尽早启动）；`TARO_APP_API_BASE_URL` 指向生产域名
- [ ] T-D5 数据备份策略：每日 pg_dump + 保留策略（cron 示例已写入部署文档）；上线前验证恢复演练

## 五、Git 与工程纪律

- [ ] T-G1 本轮 P0 修复立即提交基线（当前仓库仅 2 个提交，P1 全部代码未单独提交，风险高）
- [ ] T-G2 后续按阶段小步提交；webpack 固定版本与 Taro 兼容性记录进 CLAUDE.md
- [ ] T-G3 处理未跟踪内容：`apps/web-next`（空骨架）决定去留，`packages/domain/tooling/ui` 纳入版本控制

## 六、风险

| 风险 | 缓解 |
|---|---|
| 食材价格录入工作量（273 种） | 数据导入 + 按品类分批录入；首批只录常用食材 |
| 成本失真导致推荐不可信 | P1 阶段先验证成本链路，再开放推荐给门店 |
| 微信备案/域名周期长 | 立即启动，P1 试点期间并行 |
| 需求反算精度（BOM 完整性） | 验收 A-P2.1 用人工核算对照；BOM 缺失的菜标记提醒 |
| 单店试点偏差 | 试点 2 周数据后调参，再推广 |
