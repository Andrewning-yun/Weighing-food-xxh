# Fastfood Kitchen — V0.app UI 设计提示词

> 本文档供 V0.app 生成界面设计使用，包含项目完整的前后端数据结构和 API 接口信息。
> 将本文档完整粘贴到 V0.app 提示词输入框，即可生成与后端 API 无缝对接的前端界面。

---

## 一、项目概述

快餐厨房智能管理系统，面向**称重式快餐连锁门店**（荤素同价、按两计价的自选快餐模式）。
核心价值：通过数据驱动的推荐算法，帮助门店管理者做出更优的菜单决策，提升客单价稳定性与门店利润。

### 用户角色（8种）

| 角色 | 职责 |
|------|------|
| admin（管理员） | 系统管理、全局配置 |
| chef_manager（后厨经理） | 菜单规划、质量把控 |
| chef（厨师） | 执行烹饪 |
| prep（切配） | 备料执行 |
| breakfast_chef（早餐师傅） | 早餐线管理 |
| breakfast_assistant（早餐帮工） | 早餐辅助 |
| buyer（采购） | 食材采购 |
| store_manager（店长） | 门店经营 |

### 两个客户端

| 终端 | 技术栈 | 用途 |
|------|--------|------|
| **Web 管理后台** | React + Vite + TypeScript | 总部/店长/厨师长进行数据管理 |
| **微信小程序** | Taro 3 + React（微信小程序） | 门店后厨人员现场使用 |

---

## 二、设计系统

所有界面统一使用以下设计 token（V0 使用 Tailwind 的 CSS 变量或自定义属性实现）：

### 2.1 色彩系统

```css
/* 主色系 — 辣椒橙（湘菜/快餐感） */
--primary: #E8530E;
--primary-hover: #D14A0C;
--primary-light: #FFF0E8;
--primary-lighter: #FFF7F3;
--primary-bg: rgba(232, 83, 14, 0.06);

/* 功能色 */
--success: #2BA471;      /* 成功/新鲜绿 */
--success-light: #E8F8F1;
--warning: #F5A623;      /* 提醒黄 */
--warning-light: #FFF5E5;
--danger: #E53935;       /* 危险红 */
--danger-light: #FFEDED;
--info: #2E86DE;         /* 信息蓝 */
--info-light: #E8F2FC;

/* 中性色 */
--bg-page: #F6F3EF;      /* 页面背景（温暖米白） */
--bg-card: #FFFFFF;
--bg-hover: #F9F7F5;
--bg-input: #FAF8F6;
--border: #E8E3DD;
--border-light: #F0ECE7;
--text-primary: #2D2D2D;
--text-secondary: #6B6B6B;
--text-placeholder: #BFBFBF;
```

### 2.2 阴影与圆角

```css
--shadow-sm: 0 2px 8px rgba(139, 94, 60, 0.06);
--shadow-md: 0 4px 20px rgba(139, 94, 60, 0.08);
--shadow-lg: 0 8px 32px rgba(139, 94, 60, 0.12);
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 999px;
```

### 2.3 字体

```css
font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif;
```

### 2.4 全局组件样式

- **按钮**：主按钮品牌橙填充，次要按钮线条/幽灵样式，危险按钮红色
- **卡片**：白色背景，圆角 16px，轻阴影
- **表格**：行 hover 高亮（primary-bg），圆角容器
- **标签/徽章**：轻背景+主色文字，圆角 pill 或方形
- **表单**：浅米色输入框背景（bg-input），边框色 border，圆角 8px

---

## 三、页面清单

### Web 管理后台（18 个页面）

| 路由 | 名称 | 可见角色 |
|------|------|----------|
| `/login` | 登录 | 全部 |
| `/ingredients` | 食材管理 | admin, chef_manager, buyer, store_manager |
| `/dishes` | 菜品管理 | admin, chef_manager, buyer, store_manager |
| `/users` | 员工管理 | admin, chef_manager |
| `/stores` | 门店管理 | admin, store_manager |
| `/inventory` | 库存查看 | admin, chef_manager, prep, store_manager |
| `/menu-plans` | 菜单计划 | admin, chef_manager, chef, breakfast_chef, store_manager |
| `/operation-logs` | 操作日志 | admin, store_manager |
| `/daily-metrics` | 每日日报 | admin, store_manager |
| `/dish-feedback` | 菜品反馈 | admin, store_manager, chef_manager, chef, buyer |
| `/menu-standards` | 菜单标准 | admin, chef_manager |
| `/default-dishes` | 默认菜品 | admin, chef_manager |
| `/algorithm-config` | 算法参数 | admin, chef_manager, buyer |
| `/dish-type-tags` | 菜品标签 | admin |
| `/pairing-rules` | 搭配规则 | admin, chef_manager |
| `/audit` | 审核管理 | admin, store_manager, buyer |
| `/data-import` | 数据导入 | admin |
| `/analysis` | 菜品分析 | admin, store_manager, chef_manager, buyer |

### 微信小程序（22 个页面）

| 页面路径 | 功能 |
|----------|------|
| `pages/login/index` | 登录 |
| `pages/index/index` | 首页（门店切换、快捷操作、今日概览） |
| `pages/menu-plan/index` | 菜单中心（日期选择、菜品编排、智能推荐） |
| `pages/tasks/index` | 任务（备料任务列表、状态切换） |
| `pages/analysis/index` | 菜单分析（毛利分布、分类分布、排行榜） |
| `pages/dishes/index` | 菜品库 |
| `pages/dishes-detail/index` | 菜品详情（配方、SOP 步骤） |
| `pages/ingredients/index` | 食材库 |
| `pages/inventory/index` | 库存 |
| `pages/dish-edit/index` | 菜品编辑 |
| `pages/daily-report/index` | 每日日报 |
| `pages/store-manage/index` | 门店管理 |
| `pages/staff-manage/index` | 员工管理 |
| `pages/operation-log/index` | 操作日志 |
| `pages/audit/index` | 审核管理 |
| `pages/data-import/index` | 数据导入 |
| `pages/algorithm-config/index` | 算法参数 |
| `pages/menu-standard/index` | 菜单标准 |
| `pages/my/index` | 个人中心 |

---

## 四、API 接口契约（完整）

所有接口统一前缀 `/api`，返回格式：

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

认证方式：`Authorization: Bearer <token>`（除登录接口外所有接口需要认证）
Token 存储：localStorage key `web-admin-token`
Token 有效期：7 天

### 4.1 认证模块

```typescript
// POST /api/auth/login  — 登录
// 请求体
interface LoginRequest {
  username: string;
  password: string;
}
// 响应 data
interface LoginResponse {
  token: string;
  user: UserProfile;
}

// GET /api/auth/me  — 获取当前用户信息
// 响应 data
interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: string;    // admin | chef_manager | chef | prep | breakfast_chef | breakfast_assistant | buyer | store_manager
  storeId?: string;
  storeName?: string;
  wechatOpenId?: string;
}

// DELETE /api/auth/me  — 退出登录
```

### 4.2 食材管理

```typescript
// GET /api/ingredients  — 获取食材列表
interface ApiIngredient {
  id: string;
  name: string;
  unit: string;
  price: number;
  costPerUnit?: number;
  supplier?: string;
  spec?: string;
  isActive?: boolean;
  category?: string;
  perishable?: boolean;
  type?: 'main' | 'sub';
  updatedAt: string;
}

// POST /api/ingredients  — 创建食材
// PATCH /api/ingredients/:id  — 更新食材
// 增改请求体
interface IngredientMutation {
  id?: string;
  name: string;
  unit: string;
  price: number;
  costPerUnit?: number;
  spec?: string;
  isActive?: boolean;
  category?: string;
  perishable?: boolean;
  type?: 'main' | 'sub';
}

// DELETE /api/ingredients/:id  — 删除食材
```

### 4.3 菜品管理

```typescript
// GET /api/dishes  — 获取菜品列表
// GET /api/dishes/:id  — 获取菜品详情
interface ApiDish {
  id: string;
  name: string;
  category: string;    // steam | griddle | fry | prep | meat | vegetable | soup | rice | panfry | casserole | stir | fruit | cold | tea | porridge | pastry | breakfast_drink
  station: string;     // station_1 | station_2 | steam | griddle | fry | prep | breakfast_station
  description?: string;
  coverImageUrl?: string;
  standardCost: number;
  suggestedPrice: number;
  expectedGrossMargin: number;  // 0-1 小数
  isActive: boolean;
  mealType?: 'breakfast' | 'lunch';
  recommendWeight?: 1 | 2 | 3;  // 推荐权重：1=普通 2=推荐 3=强推
  relatedIngredients?: string;
  dishTypeTag?: '大荤' | '小荤' | '素菜' | '';
  ingredients: DishIngredient[];
  steps: CookingStep[];
  updatedAt: string;
}
interface DishIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  wasteRate: number;  // 损耗率
}
interface CookingStep {
  id: number;
  title: string;
  description: string;
  duration?: number;   // 分钟
  station?: string;
  imageUrl?: string;
}

// POST /api/dishes  — 创建菜品
// PATCH /api/dishes/:id  — 更新菜品
interface DishMutation {
  name: string;
  category: string;
  station: string;
  description?: string;
  coverImageUrl?: string;
  ingredients: DishIngredient[];
  steps: CookingStep[];
  expectedGrossMargin: number;
  standardCost: number;
  suggestedPrice: number;
  isActive: boolean;
  mealType?: 'breakfast' | 'lunch';
  recommendWeight?: 1 | 2 | 3;
  relatedIngredients?: string;
}

// DELETE /api/dishes/:id  — 删除菜品
```

### 4.4 门店管理

```typescript
// GET /api/stores  — 门店列表
interface ApiStore {
  id: string;
  name: string;
  brandId: string;
  address?: string;
  isActive?: boolean;
  contactName?: string;
  updatedAt: string;
  // 扩展字段（存在但非必填）
  targetTicketPriceBreakfast?: number | null;
  targetTicketPriceLunch?: number | null;
  pricePerLiang?: number | null;
  memberPricePerLiang?: number | null;
  ricePrice?: number | null;
}

// POST /api/stores  — 创建门店
// PATCH /api/stores/:id  — 更新门店
interface StoreMutation {
  name: string;
  brandId: string;
  address?: string;
  isActive: boolean;
  contactName?: string;
}

// DELETE /api/stores/:id  — 删除门店
```

### 4.5 用户管理

```typescript
// GET /api/users  — 用户列表
interface ApiUser {
  id: string;
  username: string;
  name?: string;
  displayName?: string;
  role: string;
  storeId?: string;
  storeName?: string;
  wechatOpenId?: string;
  updatedAt: string;
}

// POST /api/users  — 创建用户
// PATCH /api/users/:id  — 更新用户
interface UserMutation {
  username: string;
  name: string;
  role: string;
  password?: string;
  storeId?: string;
}

// DELETE /api/users/:id  — 删除用户
```

### 4.6 库存管理

```typescript
// GET /api/inventories?storeId=xxx&date=xxx  — 获取库存
// GET /api/inventories/latest?storeId=xxx  — 获取最新库存
interface DailyInventory {
  id: string;
  storeId: string;
  date: string;
  items: InventoryItem[];
  reportedBy: string;
  createdAt: string;
}
interface InventoryItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  perishable: boolean;
}

// POST /api/inventories  — 创建库存记录
// PATCH /api/inventories/:id  — 更新库存
interface InventoryMutation {
  storeId: string;
  date: string;
  items: InventoryItem[];
}
```

### 4.7 菜单计划

```typescript
// GET /api/menu-plans?storeId=xxx&date=xxx&mealType=xxx&status=xxx  — 列表
// GET /api/menu-plans/:id  — 详情
interface MenuPlan {
  id: string;
  storeId: string;
  date: string;
  mealType: 'lunch' | 'breakfast';
  dishes: MenuPlanDish[];
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}
interface MenuPlanDish {
  dishId: string;
  overrideQty?: number;
  isActive?: boolean;
}

// POST /api/menu-plans  — 创建
// PATCH /api/menu-plans/:id  — 更新
// POST /api/menu-plans/:id/publish  — 发布
interface MenuPlanMutation {
  storeId: string;
  date: string;
  mealType: 'lunch' | 'breakfast';
  dishes: MenuPlanDish[];
}
```

### 4.8 任务管理

```typescript
// GET /api/tasks?storeId=xxx&date=xxx&status=xxx  — 任务列表
interface Task {
  id: string;
  storeId: string;
  date: string;
  mealType: 'lunch' | 'breakfast';
  source: 'auto' | 'manual';
  title: string;
  items: TaskItem[];
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
}
interface TaskItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
}

// POST /api/tasks  — 创建任务
// PATCH /api/tasks/:id  — 更新任务状态
// POST /api/tasks/generate-from-menu  — 从菜单计划自动生成备料任务
interface GenerateTasksPayload {
  storeId: string;
  date: string;
  mealType: 'lunch' | 'breakfast';
}
```

### 4.9 成本核算与推荐

```typescript
// GET /api/costing/recommendations?storeId=xxx&date=xxx&mealType=xxx  — 菜品推荐
interface DishRecommendation {
  dishId: string;
  name: string;
  category: string;
  score: number;
  reasons: string[];
  recommendWeight: 1 | 2 | 3;
  inventoryStatus: 'in_stock_perishable' | 'in_stock' | 'no_stock';
}
```

### 4.10 每日经营数据

```typescript
// GET /api/daily-metrics?storeId=xxx&date=xxx&mealType=xxx  — 列表
// GET /api/daily-metrics/latest?storeId=xxx&mealType=xxx  — 最新
interface DailyMetric {
  id: string;
  storeId: string;
  storeName?: string;
  date: string;
  mealType: 'breakfast' | 'lunch';
  avgTicketPrice: number;
  customerCount: number;
  totalRevenue?: number | null;
  weather?: string | null;
  recordedBy?: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

// POST /api/daily-metrics  — 创建
// PUT /api/daily-metrics/:id  — 更新
```

### 4.11 菜品反馈

```typescript
// GET /api/dish-feedback?storeId=xxx&date=xxx&mealType=xxx  — 列表
interface DishFeedback {
  id: string;
  storeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch';
  dishId: string;
  dishName?: string;
  leftoverLevel: 'none' | 'low' | 'medium' | 'high';
  note?: string | null;
  recordedBy?: string;
  recordedByName?: string;
  createdAt: string;
}

// POST /api/dish-feedback  — 创建
// PUT /api/dish-feedback/:id  — 更新
```

### 4.12 菜单标准与默认菜品

```typescript
// GET /api/menu-standards?storeId=xxx&mealType=xxx  — 各分类标准菜品数
interface MenuStandard {
  storeId: string;
  mealType: 'breakfast' | 'lunch';
  categoryName: string;
  requiredCount: number;
}

// PUT /api/menu-standards  — 批量保存

// GET /api/default-dishes?storeId=xxx&mealType=xxx&dayOfWeek=x  — 固定菜品
interface DefaultDish {
  storeId: string;
  mealType: 'breakfast' | 'lunch';
  dayOfWeek: 1-7;
  dishId: string;
  dishName?: string;
}

// PUT /api/default-dishes  — 批量保存
```

### 4.13 算法参数配置

```typescript
// GET /api/algorithm-config?storeId=xxx  — 获取配置
interface AlgorithmConfig {
  ticketPrice: {
    deviationThreshold: number;
    lowTicketMeatBonus: number;
    lowTicketVegPenalty: number;
    highTicketHighMarginBonus: number;
    highTicketLowMarginPenalty: number;
    scaleCap: number;
  };
  freshness: {
    lookbackDays: number;
    freshnessBonus: number;
    freshnessPenalty: number;
  };
  profit: {
    highMarginBalance: number;
    mediumMarginBalance: number;
    trafficBalance: number;
  };
  diversity: {
    perAttributeBonus: number;
    diversityPenalty: number;
  };
  category: {
    lowThreshold: number;
    lowBonus: number;
    highThreshold: number;
    highPenalty: number;
  };
  feedback: {
    highLeftoverPenalty: number;
    mediumLeftoverPenalty: number;
    lowLeftoverBonus: number;
  };
  output: {
    recommendLimit: number;
  };
}

// PUT /api/algorithm-config  — 更新配置
```

### 4.14 菜品分类标签规则

```typescript
// GET /api/dish-type-tags  — 标签规则列表
interface DishTypeTag {
  id: string;
  name: string;           // '大荤' | '小荤' | '素菜'
  rules: {
    relatedIngredients: string[];
    minMainIng: number;
  };
  sortOrder: number;
}

// POST /api/dish-type-tags  — 创建
// PUT /api/dish-type-tags/:id  — 更新
// DELETE /api/dish-type-tags/:id  — 删除
```

### 4.15 搭配规则

```typescript
// GET /api/menu-pairing-rules?storeId=xxx&mealType=xxx  — 列表
interface MenuPairingRule {
  id: string;
  storeId: string;
  mealType: 'breakfast' | 'lunch';
  tagName: string;       // '大荤' | '小荤' | '素菜'
  minCount: number;
  maxCount?: number | null;
}

// PUT /api/menu-pairing-rules  — 批量保存
```

### 4.16 审核管理

```typescript
// GET /api/audit?storeId=xxx&status=xxx&module=xxx  — 审核列表
interface AuditRecord {
  id: string;
  storeId: string;
  module: string;
  action: string;
  targetId: string;
  targetName?: string;
  operatedBy: string;
  operatedByName: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectReason?: string;
  createdAt: string;
}

// GET /api/audit/stats?storeId=xxx  — 审核统计
// PATCH /api/audit/:id/approve  — 通过
// PATCH /api/audit/:id/reject  — 拒绝
```

### 4.17 操作日志

```typescript
// GET /api/operation-logs?storeId=xxx&module=xxx&startDate=xxx&endDate=xxx  — 日志列表
interface OperationLog {
  id: string;
  storeId: string;
  operatedBy: string;
  operatedByName: string;
  module: string;
  action: string;
  targetId: string;
  targetName?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  summary?: string;
  createdAt: string;
}

// GET /api/operation-logs/stats?storeId=xxx  — 日志统计
```

### 4.18 数据分析

```typescript
// GET /api/costing/analysis/ingredient-usage?storeId=xxx&startDate=xxx&endDate=xxx
// GET /api/costing/analysis/dish-frequency?storeId=xxx&startDate=xxx&endDate=xxx
// GET /api/costing/analysis/profit-distribution?storeId=xxx&startDate=xxx&endDate=xxx
// GET /api/costing/analysis/category-distribution?storeId=xxx&startDate=xxx&endDate=xxx
```

### 4.19 数据导入

```typescript
// POST /api/data-import/parse  — 解析导入内容
interface DataImportParsePayload {
  type: 'dish' | 'ingredient';
  mode: 'merge' | 'replace' | 'skip_duplicate';
  content: string;  // CSV/JSON 字符串
}

// POST /api/data-import/execute  — 执行导入
```

---

## 五、设计原则与交互规范

### 5.1 核心设计原则

1. **效率优先**：核心操作用最短路径完成，表格编辑、弹窗、抽屉式编辑
2. **成本可视化**：标准成本、建议售价、毛利率在所有相关页面高亮展示
3. **角色感知**：根据用户角色展示/隐藏功能和数据
4. **操作反馈**：保存成功/失败/删除确认/空状态/加载态都需要覆盖
5. **门店隔离**：多门店用户需要门店切换器，数据根据当前门店过滤

### 5.2 关键页面交互说明

**登录页**：
- 品牌区（快餐厨房 + 辣椒橙主色）+ 账号/密码表单
- 登录后跳转至角色第一个可用页面

**菜品编辑页（核心工作台）**：
- 同页完成：基础信息 + 配方原料 + SOP 步骤 + 成本计算结果
- 配方区可动态增删食材行，每行：食材选择器 + 用量 + 单位 + 损耗率
- SOP 区可动态增删步骤卡片，每步：标题 + 描述 + 工时 + 工位
- 成本区固定显示：标准成本、建议售价、毛利率（随编辑实时变化）
- 毛利率直接用色条/进度条可视化（>60% 绿，30-60% 橙，<30% 红）

**菜单计划页**：
- 日期选择器 + 餐别切换（早餐/正餐）
- 按菜品分类分组展示
- 每个菜品可调节数量
- 智能推荐弹窗：列出推荐菜品 + 推荐原因标签 + 评分
- 底部操作栏：发布/保存草稿
- 原材料汇总清单（已选菜品的 BOM 展开）

**库存填报页**：
- 按门店 + 日期筛选
- 食材列表 + 数量输入 + 保存
- 易腐食材高亮提示

**每日日报页**：
- 门店 + 日期 + 餐别
- 客单价、就餐人数、天气
- 历史数据趋势展示（折线图或指标卡对比）

**菜品分析页**：
- 日期范围选择
- Tab 切换：用料排行 / 菜品频次 / 毛利分布 / 分类分布
- 图表推荐：柱状图、饼图、排行榜

### 5.3 状态处理规范

所有页面必须处理以下状态：

| 状态 | 处理方式 |
|------|----------|
| **Loading** | Skeleton 骨架屏或加载旋转指示器 |
| **Empty (无数据)** | 插画 + 提示文字 + 建议操作按钮 |
| **Error (请求失败)** | 错误提示 + 重试按钮 |
| **Success (操作成功)** | Toast 轻提示或内联成功消息 |
| **Delete (删除)** | 确认弹窗 + 二次确认 |
| **Save (保存)** | 保存中按钮禁用 + 完成反馈 |
| **Offline/Network** | 全局网络状态监测 + 重连提示 |

### 5.4 数据可视化建议

- 毛利率：彩色进度条或仪表盘
- 经营趋势：折线图（客单价、就餐人数按日）
- 菜品频次：横向条形图
- 分类分布：饼图或环形图
- 食材用量：排行榜条形图

---

## 六、布局结构

### Web 后台布局

```
┌─────────────────────────────────────────────┐
│  Sidebar (240px)        │  Main             │
│  ┌────────────────┐     │  ┌───────────────┐ │
│  │ Brand Block    │     │  │ Header Bar    │ │
│  │ 快餐厨房 + 标题    │     │  │ 标题 + 副标题    │ │
│  └────────────────┘     │  │ + 用户信息     │ │
│  ┌────────────────┐     │  └───────────────┘ │
│  │ Navigation     │     │  ┌───────────────┐ │
│  │ · 食材管理       │     │  │ Content      │ │
│  │ · 菜品管理       │     │  │ (页面内容区)   │ │
│  │ · 员工管理       │     │  │              │ │
│  │ · ...          │     │  │              │ │
│  └────────────────┘     │  └───────────────┘ │
│  Sidebar Footnote       │                     │
└─────────────────────────────────────────────┘
```

- 响应式：≤1024px 时侧边栏折叠到顶部
- 导航项高亮当前活跃路由
- 用户信息区域在顶部栏右侧（显示名称 + 角色 + 退出按钮）

### 小程序布局

- 全局 TabBar：首页 / 食材库 / 菜单中心 / 任务 / 个人中心
- 所有页面使用标准导航栏（顶部标题）
- 吸顶筛选/搜索栏（sticky-header 模式）
- 底部操作栏（适用于菜单计划等需要发布操作的页面）

---

## 七、V0 生成指令

请严格按照上述设计系统和 API 契约，生成以下页面：

1. **Web 管理后台** — 生成一个完整的 React SPA，包含：
   - 左侧侧边栏导航 + 右侧内容区域的布局框架
   - 登录页
   - 食材管理页（CRUD 表格 + 编辑弹窗/抽屉）
   - 菜品管理页（CRUD 表格 + 详细编辑页）
   - 菜品编辑页（最核心页面 — 同页完成：基本信息 + 配方BOM + SOP步骤 + 成本展示）
   - 门店管理页
   - 员工管理页
   - 库存查看页
   - 菜单计划页（日期选择 + 菜品编排 + 发布）
   - 每日日报页（填报 + 趋势图表）
   - 菜品反馈页
   - 算法参数配置页（表单分组配置）

2. **配色与风格**：辣椒橙主色 + 温暖米白背景，餐饮专业感，拒绝过度娱乐化

3. **API 对接**：生成代码时直接调用上述 API 端点，使用 fetch 请求 + JWT Bearer token 认证

请使用 TypeScript + React + Tailwind CSS，确保：
- 所有组件处理 loading / empty / error 状态
- 角色权限控制（不同角色看到不同页面和操作按钮）
- 响应式布局
- 操作反馈（toast）
- 门店隔离（全局 storeId 上下文）

---

> 本文档基于 fastfood-kitchen 项目的 NestJS API + React 前端/Taro 小程序的完整前后端代码生成。
> 所有 API 端点、数据类型、枚举值均源于项目源代码，与实际运行接口完全一致。
