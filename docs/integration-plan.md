# 餐链通 v1→v2 整合 + 新功能实现计划

## Context

两个项目：
- **v1** (`20260331200838`): 原生微信小程序，16个页面，功能完整但技术栈老旧（WXML/JS/云开发）
- **v2** (`fastfood-kitchen`): Taro monorepo + NestJS API + React Web Admin，架构现代但功能仅完成约30%

目标：以 v2 为基础，整合 v1 全部业务功能，并新增需求。

### 需求清单

| # | 需求 | 说明 |
|---|------|------|
| R1 | 添加「切配」角色 | 每天填报库存 |
| R2 | 添加「早餐师傅」「早餐副手」角色 | 管理早餐模块，可创建/编辑早餐菜单；厨师长可见他们的菜单 |
| R3 | 添加「店长」角色 | 与管理员同权限但**只读**，不可编辑；通过线下沟通 |
| R4 | 每日库存系统 | 非进销存，按具体食材每日快照填报 |
| R5 | 库存影响推荐 | 有库存+不易存放的非冻品优先推荐 |
| R6 | 早餐分菜单 | 独立菜品库，与正餐完全隔离维护 |
| R7 | 管理者推荐权 | 固定三档推荐权重：普通(1x)/推荐(2x)/强推(3x) |
| R8 | 操作历史记录 | 算法参数修改、菜品增删改的统一审计日志，方便管理员查阅追溯 |

### 用户确认的关键决策
- 库存填报：**按具体食材**填写数量
- 早餐/正餐：**独立菜品库**，各自维护
- 推荐权重：**固定三档** — 普通(1x)/推荐(2x)/强推(3x)
- 切配权限：填报库存 + 可查看菜单/任务并修改自己的任务状态

---

## Phase 1: API 数据模型扩展

### 1.1 扩展 UserRole 枚举
**文件**: `services/api/src/modules/user/user.entity.ts`

当前: `ADMIN | CHEF_MANAGER`
改为: `ADMIN | CHEF_MANAGER | CHEF | PREP | BREAKFAST_CHEF | BREAKFAST_ASSISTANT | BUYER | STORE_MANAGER`

```ts
export enum UserRole {
  ADMIN = 'admin',                     // 管理员 - 全部权限
  CHEF_MANAGER = 'chef_manager',       // 厨师长 - 管理正餐模块，可查看早餐
  CHEF = 'chef',                       // 厨师 - 正餐操作
  PREP = 'prep',                       // 切配 - 填报库存+部分任务编辑
  BREAKFAST_CHEF = 'breakfast_chef',   // 早餐师傅 - 管理早餐模块
  BREAKFAST_ASSISTANT = 'breakfast_assistant', // 早餐副手 - 早餐模块辅助
  BUYER = 'buyer',                     // 采购 - 查看任务/食材
  STORE_MANAGER = 'store_manager',     // 店长 - 管理员同权限但只读
}
```

**角色权限矩阵**：

| 功能模块 | admin | chef_manager | chef | prep | breakfast_chef | breakfast_assistant | buyer | store_manager |
|---------|-------|-------------|------|------|---------------|--------------------|-------|--------------|
| 正餐菜单 | CRUD | CRUD | 只读 | 只读 | 只读 | 只读 | 只读 | 只读 |
| 早餐菜单 | CRUD | 只读 | - | - | CRUD | 编辑 | - | 只读 |
| 库存填报 | 填报 | 查看 | - | 填报 | - | - | 查看 | 只读 |
| 任务系统 | CRUD | CRUD | 只读 | 部分编辑 | 早餐任务 | 早餐任务 | 查看 | 只读 |
| 食材库 | CRUD | 查看 | 只读 | 只读 | 只读 | 只读 | 查看 | 只读 |
| 菜品编辑 | CRUD | CRUD | CRUD(正餐) | - | CRUD(早餐) | 编辑(早餐) | - | 只读 |
| 员工管理 | CRUD | - | - | - | - | - | - | 只读 |
| 门店管理 | CRUD | 查看 | - | - | - | - | - | 只读 |
| 数据分析 | 全部 | 全部 | - | - | 早餐 | - | - | 只读 |
| 操作日志 | 全部 | 查看 | - | - | - | - | - | 只读 |

### 1.2 扩展 Dish Entity
**文件**: `services/api/src/modules/dish/dish.entity.ts`

新增字段：
- `recommendWeight`: number, default 1 — 推荐权重 (1=普通, 2=推荐, 3=强推)
- `mealType`: enum ('lunch'|'breakfast'), default 'lunch' — 属于正餐还是早餐菜品库
- `relatedIngredients`: simple-varchar (逗号分隔的食材属性标签，如 '鸡,菌菇')

扩展 `DishCategory` 枚举：
```ts
enum DishCategory {
  // 正餐 (9类，对齐v1)
  STEAM = 'steam',         // 蒸菜
  PAN_FRY = 'panfry',      // 煎扒
  DEEP_FRY = 'fry',        // 油炸
  CASSEROLE = 'casserole',  // 砂锅
  STIR_FRY = 'stir',       // 炒菜
  FRUIT = 'fruit',         // 水果
  COLD = 'cold',           // 凉菜
  SOUP = 'soup',           // 例汤
  TEA = 'tea',             // 茶饮
  // 早餐 (3类)
  PORRIDGE = 'porridge',     // 粥品
  PASTRY = 'pastry',         // 面点
  BREAKFAST_DRINK = 'breakfast_drink', // 饮品
}
```

扩展 `Station` 枚举：
```ts
enum Station {
  PREP = 'prep',
  STATION_1 = 'station_1',
  STATION_2 = 'station_2',
  BREAKFAST_STATION = 'breakfast_station',
}
```

### 1.3 扩展 Ingredient Entity
**文件**: `services/api/src/modules/ingredient/ingredient.entity.ts`

新增字段：
- `category`: string — 食材分类（蔬菜/肉/禽/菌菇 等，对齐 v1 的 17 大分类）
- `perishable`: boolean, default false — 是否易腐（非冻品、不易存放）
- `type`: simple-varchar ('main'|'sub') — 主料/辅料

### 1.4 新增 DailyInventory Entity + Module
**新文件**: `services/api/src/modules/inventory/`

```
inventory/
  inventory.entity.ts
  inventory.module.ts
  inventory.controller.ts
  inventory.service.ts
  dto/
    create-inventory.dto.ts
```

Entity 字段：
```ts
@Entity('daily_inventories')
class DailyInventory {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  storeId: string;              // FK -> Store

  @Column({ type: 'date' })
  date: string;                 // YYYY-MM-DD

  @Column({ type: 'simple-json' })
  items: InventoryItem[];       // [{ ingredientId, name, quantity, unit, category, perishable }]

  @Column()
  reportedBy: string;           // FK -> User

  @CreateDateColumn()
  createdAt: Date;
}

interface InventoryItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  perishable: boolean;
}
```

API Endpoints：
- `POST /inventories` — 填报库存 (PREP, ADMIN)
- `GET /inventories?storeId=&date=` — 查询某日库存
- `GET /inventories/latest?storeId=` — 获取最近一次填报
- `PATCH /inventories/:id` — 修改填报 (PREP, ADMIN)

### 1.5 新增 MenuPlan Entity + Module
**新文件**: `services/api/src/modules/menu-plan/`

```
menu-plan/
  menu-plan.entity.ts
  menu-plan.module.ts
  menu-plan.controller.ts
  menu-plan.service.ts
  dto/
    create-menu-plan.dto.ts
    update-menu-plan.dto.ts
```

Entity 字段：
```ts
@Entity('menu_plans')
class MenuPlan {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  storeId: string;              // FK -> Store

  @Column({ type: 'date' })
  date: string;                 // YYYY-MM-DD

  @Column({ type: 'enum', enum: MealType })
  mealType: 'lunch' | 'breakfast';

  @Column({ type: 'simple-json' })
  dishes: MenuPlanDish[];       // [{ dishId, overrideQty?, isActive? }]

  @Column({ type: 'enum', enum: MenuPlanStatus, default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column()
  createdBy: string;            // FK -> User

  @Column({ nullable: true })
  reviewedBy: string;           // FK -> User

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

API Endpoints：
- `POST /menu-plans` — 创建菜单计划 (ADMIN, CHEF_MANAGER[正餐], BREAKFAST_CHEF[早餐])
- `GET /menu-plans?storeId=&date=&mealType=` — 查询
- `GET /menu-plans/:id` — 详情
- `PATCH /menu-plans/:id` — 修改
- `POST /menu-plans/:id/publish` — 发布 (ADMIN, CHEF_MANAGER, BREAKFAST_CHEF)

**关键业务规则**：
- 厨师长可查看早餐菜单，但不可编辑（除非也是 admin）
- 早餐师傅/副手只能操作 mealType=breakfast 的菜单

### 1.6 新增 Task Entity + Module
**新文件**: `services/api/src/modules/task/`

```
task/
  task.entity.ts
  task.module.ts
  task.controller.ts
  task.service.ts
```

Entity 字段：
```ts
@Entity('tasks')
class Task {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @Column({ type: 'date' })
  date: string;                 // YYYY-MM-DD

  @Column({ type: 'enum', enum: MealType })
  mealType: 'lunch' | 'breakfast';

  @Column({ type: 'enum', enum: TaskSource })
  source: 'auto' | 'manual';   // auto=菜单BOM汇总, manual=手动添加

  @Column()
  title: string;

  @Column({ type: 'simple-json' })
  items: TaskItem[];            // [{ ingredientId, name, quantity, unit }]

  @Column({ nullable: true })
  assignedTo: string;           // FK -> User

  @Column({ type: 'enum', enum: TaskStatus, default: 'pending' })
  status: 'pending' | 'in_progress' | 'completed';

  @Column({ nullable: true })
  completedBy: string;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

API Endpoints：
- `GET /tasks?storeId=&date=&mealType=` — 查询任务列表
- `POST /tasks` — 创建手动任务 (ADMIN, CHEF_MANAGER)
- `PATCH /tasks/:id` — 更新任务状态
  - PREP 只能修改 assignedTo=自己的任务
  - BREAKFAST_CHEF/BREAKFAST_ASSISTANT 只能操作 breakfast 任务
- `POST /tasks/generate-from-menu` — 从菜单计划自动生成采购任务

### 1.7 新增 OperationLog Entity + Module (R8 操作历史)
**新文件**: `services/api/src/modules/operation-log/`

```
operation-log/
  operation-log.entity.ts
  operation-log.module.ts
  operation-log.controller.ts
  operation-log.service.ts
```

Entity 字段：
```ts
@Entity('operation_logs')
class OperationLog {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  storeId: string;

  @Column()
  operatedBy: string;           // FK -> User

  @Column()
  operatedByName: string;       // 操作人姓名(冗余，方便查询)

  @Column()
  module: string;               // 模块名: 'dish'|'ingredient'|'algorithm'|'menu_plan'|'inventory'|'task'|'user'|'store'

  @Column()
  action: string;               // 操作: 'create'|'update'|'delete'|'publish'|'config_change'

  @Column()
  targetId: string;             // 操作目标ID

  @Column({ nullable: true })
  targetName: string;           // 目标名称(如菜品名)

  @Column({ type: 'simple-json', nullable: true })
  before: Record<string, any>;  // 变更前数据快照

  @Column({ type: 'simple-json', nullable: true })
  after: Record<string, any>;   // 变更后数据快照

  @Column({ type: 'text', nullable: true })
  summary: string;              // 人类可读的摘要: "张三 将菜品「粉蒸肉」推荐权重从 普通 改为 强推"

  @CreateDateColumn()
  createdAt: Date;
}
```

API Endpoints：
- `GET /operation-logs?storeId=&module=&action=&operatedBy=&startDate=&endDate=` — 查询日志(分页)
- `GET /operation-logs/stats` — 日志统计(按模块/操作人分组)

**关键设计**：
- 提供 `OperationLogService.log()` 方法，其他 service 在增删改时调用
- before/after 存储关键字段的差异，而非完整实体
- summary 自动生成人类可读的描述

**需要记录日志的操作**：
| 模块 | 触发操作 |
|------|---------|
| dish | 创建/修改/删除菜品；修改 recommendWeight |
| ingredient | 创建/修改/删除食材；修改 perishable 标记 |
| algorithm | 修改推荐算法参数配置 |
| menu_plan | 创建/发布/归档菜单计划 |
| inventory | 填报/修改库存 |
| task | 创建/完成任务 |
| user | 创建/修改/停用员工 |
| store | 创建/修改门店 |

### 1.8 扩展 Costing 模块 — 推荐算法
**文件**: `services/api/src/modules/costing/`

新增 Endpoint: `GET /costing/recommendations?storeId=&date=&mealType=`

算法逻辑：
```
score(dish) =
  baseScore(成本合理度, 参考grossMargin) * 1.0
  + recommendWeight * 30        // 管理者推荐权重 (1/2/3) * 30
  + inventoryBonus              // 库存优先加分:
    if (dish有易腐食材 && 今日库存有该食材) +40
    if (dish有易腐食材 && 无库存) -10
  - recentFrequency * 5         // 近期出现频次惩罚(防重复)
```

排序后返回推荐菜品列表，每道菜附带推荐理由：
```ts
interface DishRecommendation {
  dishId: string;
  name: string;
  category: string;
  score: number;
  reasons: string[];  // 如: ["今日库存有易腐食材「鸡块」", "管理者强推"]
  recommendWeight: 1|2|3;
  inventoryStatus: 'in_stock_perishable' | 'in_stock' | 'no_stock';
}
```

### 1.9 数据库 Migration
**新文件**: `services/api/src/database/migrations/20260412000000-add-v1-features.ts`

- 新增 daily_inventories 表
- 新增 menu_plans 表
- 新增 tasks 表
- 新增 operation_logs 表
- dishes 表新增 recommend_weight, meal_type, related_ingredients 列
- ingredients 表新增 category, perishable, type 列
- users 表 role 枚举扩展为 8 个值

### 1.10 更新 dev-seed 数据
**文件**: `services/api/src/database/dev-seed.service.ts`

- 添加各角色测试账号：
  - admin / admin1234 (管理员)
  - zhangchef / 123456 (厨师长)
  - lichushi / 123456 (厨师)
  - wangqiepei / 123456 (切配)
  - zaochanshi1 / 123456 (早餐师傅)
  - zaocanfushou / 123456 (早餐副手)
  - wangcaigou / 123456 (采购)
  - zhangdianzhang / 123456 (店长)
- 添加 v1 的 120+ 食材 (迁移自 ingredients_data.js)
- 添加 v1 的 60+ 正餐菜品 (迁移自 ingredients_data.js DEFAULT_DISHES)
- 添加早餐菜品示例 (粥/面点/饮品)

---

## Phase 2: 共享包更新

### 2.1 packages/config/index.ts
- 扩展 `ApiRole` 类型: `'admin'|'chef_manager'|'chef'|'prep'|'breakfast_chef'|'breakfast_assistant'|'buyer'|'store_manager'`

### 2.2 packages/api-client/index.ts
新增接口和方法：
- `ApiInventoryItem`, `ApiDailyInventoryRecord`, `InventoryMutation`
- `ApiMenuPlanRecord`, `MenuPlanMutation`
- `ApiTaskRecord`, `TaskMutation`
- `ApiDishRecommendation`
- `ApiOperationLogRecord`
- 对应的 createApiClient 方法

---

## Phase 3: 小程序端（apps/miniapp）

### 3.1 页面路由 (app.config.ts)
新增页面：
```
pages/index/index          — 首页仪表盘
pages/menu-plan/index      — 菜单中心 (早餐/正餐tab)
pages/tasks/index          — 任务系统
pages/audit/index          — 审核记录
pages/inventory/index      — 库存填报 (切配角色)
pages/ingredients/index    — 食材库
pages/dish-edit/index      — 菜品编辑
pages/store-manage/index   — 门店管理
pages/staff-manage/index   — 员工管理
pages/analysis/index       — 数据分析
pages/operation-log/index  — 操作日志查看
```

现有页面保留: login, dishes, dishes-detail, my

### 3.2 新增 API 调用
- `apps/miniapp/src/api/inventory.ts`
- `apps/miniapp/src/api/menu-plan.ts`
- `apps/miniapp/src/api/task.ts`
- `apps/miniapp/src/api/recommendation.ts`
- `apps/miniapp/src/api/operation-log.ts`

### 3.3 各页面功能说明

| 页面 | 核心功能 | 角色权限 |
|------|---------|---------|
| **index** | 今日菜单概览(按分类+mealType分组)、待办任务数、门店切换 | 全部可见(按角色过滤) |
| **menu-plan** | 早餐/正餐tab切换；日期选择；菜品列表(含推荐标记/权重徽章)；添加/移除菜品 | admin全权；chef_manager管理正餐+查看早餐；breakfast_chef管理早餐；其他只读 |
| **tasks** | 自动任务+手动任务；完成标记 | prep修改自己任务；breakfast_chef操作早餐任务 |
| **inventory** | 日期选择；食材列表(按分类分组)；填写库存数量 | prep+admin可填报 |
| **ingredients** | 分类浏览+搜索；食材详情 | 只读 |
| **dish-edit** | BOM配料编辑+工序步骤编辑+推荐权重设置 | admin全权；chef_manager编辑正餐；breakfast_chef编辑早餐 |
| **store-manage** | 门店CRUD+切换 | admin |
| **staff-manage** | 员工CRUD(含8种角色) | admin；store_manager只读 |
| **analysis** | 菜单统计；推荐菜品列表(含推荐理由) | admin/chef_manager全量；breakfast_chef看早餐 |
| **audit** | 审核记录时间线 | admin/chef_manager |
| **operation-log** | 操作历史查询(按模块/操作人/时间筛选) | admin查看全部；store_manager只读 |

### 3.4 角色路由守卫
**新文件**: `apps/miniapp/src/utils/role-guard.ts`

| 角色 | 可访问页面 |
|------|----------|
| admin | 全部 |
| chef_manager | 除staff-manage外的全部(早餐菜单只读) |
| chef | index/menu-plan(正餐只读)/tasks(正餐只读)/ingredients/dish-edit(正餐) |
| prep | index/inventory/tasks(部分编辑)/ingredients(只读) |
| breakfast_chef | index/menu-plan(breakfast可编辑)/tasks(breakfast)/ingredients(只读)/dish-edit(breakfast) |
| breakfast_assistant | index/menu-plan(breakfast可编辑)/tasks(breakfast)/ingredients(只读) |
| buyer | index/tasks(只读)/ingredients(只读) |
| store_manager | 全部只读 |

### 3.5 店长只读模式实现
在 Taro 请求层或组件层添加只读拦截：
- store_manager 登录后，所有写操作按钮隐藏或 disabled
- API 层通过 Roles decorator 确保店长角色无法调用写接口

---

## Phase 4: Web Admin 端（apps/web-admin）

### 4.1 新增页面
- `pages/inventory.tsx` — 库存查看(按日期/门店筛选)
- `pages/menu-plans.tsx` — 菜单计划管理(早餐/正餐tab)
- `pages/operation-logs.tsx` — 操作日志查询(按模块/操作人/时间筛选，含before/after diff展示)

### 4.2 修改现有页面
- `dishes.tsx` — 新增 mealType 筛选(lunch/breakfast)；recommendWeight 三档选择器；relatedIngredients 编辑
- `ingredients.tsx` — 新增 category 下拉(17分类)；perishable 复选框；type 选择(main/sub)
- `users.tsx` — 新增 8 种角色；门店多选(替换单选)
- `stores.tsx` — 新增更多字段(brandId, contactPhone, chefCount, dailyCustomers)

### 4.3 侧边栏布局更新
在 layout.tsx 中添加新菜单项：
- 库存查看
- 菜单计划
- 操作日志

---

## Phase 5: 实施顺序

1. **API 数据模型** → entity扩展 → migration → operation-log模块 → 验证 API 可启动
2. **共享包更新** → config → api-client 类型和方法
3. **API 业务模块** → inventory → menu-plan → task → costing推荐算法
4. **小程序核心页面** → login(已有) → index → menu-plan → inventory
5. **小程序运营页面** → tasks → audit → ingredients → dish-edit
6. **小程序管理页面** → store-manage → staff-manage → analysis → operation-log
7. **Web Admin 更新** → dishes/ingredients/users 扩展 → inventory → menu-plans → operation-logs
8. **推荐算法集成** → costing 模块扩展 → 小程序 analysis 页面
9. **种子数据** → 迁移v1的120+食材和60+菜品 → 添加早餐菜品

---

## 验证方式

1. **API**: 启动 `npm run dev`，用 Postman/curl 验证所有 CRUD 端点
2. **Migration**: `npm run migration:run` 无报错
3. **操作日志**: 每次菜品修改后，检查 operation_logs 表有记录，且 before/after 和 summary 正确
4. **小程序**: `npm run dev:weapp`，微信开发者工具验证页面渲染和交互
5. **Web Admin**: `npm run dev`，浏览器验证管理页面
6. **端到端**: 
   - admin 登录 → 创建门店/8种角色员工/食材/菜品
   - 切配填报库存
   - 早餐师傅创建早餐菜单
   - 厨师长查看早餐菜单(只读) + 创建正餐菜单
   - 查看推荐列表(含库存优先+权重推荐)
   - 店长登录 → 验证全部只读
   - admin查看操作日志 → 验证所有修改操作有记录
