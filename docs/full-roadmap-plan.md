# 称重快餐菜品库管理系统 - 全面铺开方案文档

## 一、项目信息

- **项目名称：** fastfood-kitchen - 称重快餐连锁菜品知识和成本管理系统
- **目标场景：** 100㎡ 称重自选快餐连锁门店
- **现有规模：** 单店日均客流 500-1000，未来扩展 5-50 家连锁
- **核心痛点：**
  - 出品依赖大厨经验，人员流动 -> 口味不稳定
  - 成本核算粗放，不知道每道菜真实毛利
  - 知识没有沉淀，新人培训周期长

## 二、产品全景规划

### 2.1 用户角色与权限矩阵

| 角色 | 门店范围 | 权限等级 | 可访问功能 |
| --- | --- | --- | --- |
| 系统管理员 / 加盟商 | 全品牌 | 全部权限 | 门店管理 / 用户管理 / 原料管理 / 菜品管理 / 成本报表 / 数据分析 |
| 门店厨师长 | 单店 | 管理权限 | 门店菜品查看 / 成本查看 / 菜品维护 |
| 一线厨师 / 切配 | 单店 | 查看权限 | 查看菜品配方 / 查看烹饪SOP |

### 2.2 完整功能模块

#### 📦 基础组织模块

- 多门店管理
- 用户管理 & 角色分配
- 品牌管理（多品牌支持，v2 路线）
- 门店业绩统计（v2 路线）

#### 🥘 菜品知识模块

- 菜品分类管理（蒸/煎/炸/切配/荤/素）
- 菜品档案管理（基本信息 + 封面图）
- 配方管理（原料 + 用量 + 损耗率）
- 烹饪 SOP 管理（步骤 + 文字 + 图片 + 耗时 + 工位）
- 菜品版本管理（配方变更记录，v2 路线）
- 季节性时令菜品上下架

#### 🍅 原料模块

- 原料档案
- 单位/价格/供应商/规格
- 启用/停用
- 原料价格变化自动触发全菜品成本重算

#### 💰 成本核算模块

- 自动计算菜品标准成本 `sum(用量 × 单价 × (1+损耗率))`
- 根据目标毛利率自动计算建议售价 `成本 / (1 - 毛利率)`
- 建议售价自动取整到 0.5 元
- 成本报表（按毛利率排序，找出高/低毛利菜品）
- 动态毛利分析（结合销量 -> 贡献度分析，v2 路线）
- 损耗统计实际损耗（v2 路线）

#### 👨‍🍳 门店操作模块

- 我的工位 -> 只看当前工位菜品
- 菜品搜索 + 分类筛选
- 菜品详情 -> 配方 + SOP 展示
- 今日备料估算 -> 根据预估客流算出需要备多少原料（v2 路线）

#### 🖥️ 管理后台功能

- 登录
- 门店 CRUD
- 用户 CRUD
- 原料 CRUD
- 菜品 CRUD
- 成本报表
- 数据导出 Excel（v2 路线）

#### 📱 小程序厨师端功能

- 微信一键登录
- 菜品列表
- 我的工位
- 菜品详情（配方 + SOP）
- 离线缓存（v2 添加）

## 三、技术架构方案 (Full Scheme 全面铺开)

### 3.1 架构选择 -> 保持 Path B 平衡方案

```text
apps/
├── miniapp/          # 微信小程序 (Taro + React) -> 厨师端
├── web-admin/        # 管理后台 (Next.js + React) -> 管理者端
└── mobile/           # 预留 Android/iOS 原生 (React Native) -> v2 路线

services/
└── api/              # 后端 API (NestJS + TypeORM + PostgreSQL)

packages/
├── domain/           # 共享领域类型定义 ✓ 已完成
├── api-client/       # 共享 API 客户端 -> 预留待扩展
├── config/           # 共享配置 -> 预留待扩展
├── ui/               # 共享组件库 -> 预留待扩展
└── tooling/          # 构建工具配置 -> 预留待扩展
```

### 3.2 技术栈选择

| 层级 | 技术 | 理由 |
| --- | --- | --- |
| 后端 | NestJS + TypeScript + TypeORM + PostgreSQL | 模块化清晰，AI 开发友好，企业级成熟稳定 |
| 管理后台 | Next.js 14 + React + TypeScript | 开发快速，适合管理后台 |
| 小程序 | Taro 3 + React + TypeScript | 一次开发多端，支持微信小程序 |
| 数据库 | PostgreSQL | 支持 JSONB 存储可变结构（配方/SOP） |
| 认证 | JWT + bcrypt | 成熟稳定，适合 |
| 包管理 | npm workspaces | 当前环境统一，验证可用 |

### 3.3 数据设计要点

#### 关键实体关系

```text
Brand 1 ---> N Store
Store 1 ---> N User
Ingredient M ---> N Dish
Dish 1 ---> N DishIngredient
Dish 1 ---> N CookingStep
```

#### 成本计算核心规则

- 原料价格更新 -> 自动触发所有菜品成本重算
- 厨师看不到成本数据 -> 后端 API 拦截，前端不展示
- 工位分类 = 厨师分工 -> "我的工位" 过滤

## 四、roadmap 开发路线

### 第一阶段 MVP (当前完成) ✅

- **目标：** 基本交付，核心功能可用
- **完成内容：**
  - 工程架构收敛
  - 后端全核心 API
  - 管理后台全功能 CRUD
  - 小程序厨师查看功能
  - 成本自动计算
  - 权限控制
  - 基础测试覆盖
  - 文档齐全
- **预计时间：** ~ 10 天 -> 实际完成：按计划完成

### 第二阶段 v2 (未来扩展)

- **目标：** 完善体验，增加高级功能
- **计划内容：**
  - 完成 packages/ 共享包 (api-client / config / ui)
  - React Native 原生 App 开发 Android/iOS
  - 图片上传 -> OSS 存储
  - 库存预估 -> 根据菜品配方 + 预估客流算备料量
  - 多品牌支持
  - 数据导出 Excel
  - 小程序离线缓存
  - 更多数据报表（毛利贡献/损耗分析）
  - 门店巡店检查功能
- **预计时间：** ~ 14-21 天

## 五、当前构建状态验证

- **最近一次全量构建 (2026-04-08):**

```text
npm install && npm run build --workspaces
```

- **结果：**

```text
✓ services/api 编译成功
✓ apps/miniapp 编译成功
✓ apps/web-admin 编译成功

⭐️ All workspaces built successfully!
```

- **可运行命令：**

```bash
# 安装依赖
npm install

# 配置环境
cp services/api/.env.example services/api/.env
# 编辑 .env 填写 PostgreSQL 配置

# 运行数据库迁移
npm run migration:generate --workspace=api
npm run migration:run --workspace=api

# 启动开发服务
npm run dev:api --workspace=api              # http://localhost:3000
npm run dev:web-admin --workspace=web-admin  # http://localhost:3000
npm run dev:miniapp --workspace=miniapp      # -> dist/dev/weapp 微信开发者工具打开
```

## 六、总结

| 验收项 | 结果 |
| --- | --- |
| 工程配置统一 | ✅ npm workspaces |
| 后端 API 完整可启动 | ✅ 所有模块齐全 |
| 管理后台完整可用 | ✅ 所有页面完成 |
| 小程序完整可用 | ✅ 查看功能完成 |
| 成本计算正确 | ✅ 算法验证通过 |
| 权限控制正确 | ✅ 厨师看不到成本 |
| 全项目构建 | ✅ 全部成功 |
| 文档齐全 | ✅ README + DEPLOY + 本计划文档 |

**当前状态：MVP 已经达到基本交付标准，可以开始测试使用。**
