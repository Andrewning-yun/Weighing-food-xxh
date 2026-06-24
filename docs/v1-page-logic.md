# V1 微信小程序页面逻辑文档

> 基于微信原生小程序（WXML + WXSS + JS）+ 云开发环境，生成日期 2026-04-15

---

## 目录

1. [全局架构](#1-全局架构)
2. [页面详解](#2-页面详解)
3. [组件详解](#3-组件详解)
4. [工具模块](#4-工具模块)

---

## 1. 全局架构

### 1.1 技术栈

- **框架**：微信原生小程序（非 Taro）
- **数据存储**：`wx.setStorageSync` / `wx.getStorageSync`（本地 Storage）
- **云开发**：`wx.cloud` + 云数据库（部分功能）
- **云环境 ID**：`cloud1-2gfjnemmda1f3010`

### 1.2 角色体系（4 种角色）


| 角色  | 标识          | 说明                      |
| --- | ----------- | ----------------------- |
| 管理员 | `admin`     | 全局权限，管理所有数据、用户、门店       |
| 厨师长 | `chef_head` | 管理菜品库/食材库，创建补货任务，提交采购审核 |
| 厨师  | `chef`      | 查看菜品库，录入每日菜单，认领补货任务     |
| 采购员 | `buyer`     | 审核采购清单，修改采购数量，管理食材库     |


### 1.3 数据隔离设计

所有门店级数据按 `storeId` 隔离存储：

- 菜单：`menu_{storeId}_{date}`
- 手动任务：`manual_tasks_{storeId}_{date}`
- 已完成任务：`completed_tasks_{storeId}_{date}`
- 审核记录：`audit_records_{storeId}`
- 默认菜品：`default_dishes_{storeId}`
- 菜单标准：`menu_standard_{storeId}`

全局数据（无门店隔离）：

- 菜品库：`dish_library_v2`
- 食材库：`ingredients_lib`
- 食材分类：`ingredients_categories`
- 食材单位：`ingredients_units`
- 员工列表：`staff_list`
- 绑定码：`bind_codes`

### 1.4 app.js 全局逻辑

**globalData 结构：**

```javascript
{
  userInfo: null,           // 用户基本信息
  userRole: null,           // 角色：'chef' | 'chef_head' | 'buyer' | 'admin'
  token: null,              // 登录令牌
  storeId: null,            // 当前门店 ID
  staffInfo: null,          // 当前登录员工完整信息
  cloudEnv: 'cloud1-2gfjnemmda1f3010',
}
```

**onLaunch 生命周期：**

1. 初始化云开发 `wx.cloud.init()`
2. 初始化默认 admin 账号 `storeUtil.initDefaultStaff()`
3. 初始化菜品库 `this._initDishLibrary()`（若 Storage 中无 `dish_library_v2` 则写入默认数据）
4. 一次性数据迁移 `this._migrateDishLibrary()`（将旧 `bom[]` 格式迁移为 `mainIngredients/subIngredients`）
5. 门店数据迁移 `storeUtil.migrateOldData()`

**核心方法：**


| 方法                       | 说明                          |
| ------------------------ | --------------------------- |
| `checkLoginStatus()`     | 检查本地 Storage 中的登录态          |
| `requireAuth()`          | 未登录则跳转 `/pages/login/login` |
| `login()`                | 微信 `wx.login()` 获取 code     |
| `logout()`               | 清除所有状态并跳转登录页                |
| `checkPermission(roles)` | 检查当前用户是否属于指定角色列表            |
| `getRoleName(role)`      | 返回角色中文名                     |


---

## 2. 页面详解

### 2.1 首页 (`pages/index/index`)

**页面用途**：仪表盘首页，展示关键数据和快捷导航入口。

**数据展示**：

- 用户角色信息
- 当前门店名称
- 今日菜单（按分类折叠）
- 待办任务数
- 待审核数

**数据读取**：

- `storeUtil.getCurrentStore()` → 当前门店
- `storeUtil.getMenu(today)` → 今日菜单
- `storeUtil.calcPendingTaskCount(today)` → 待完成任务数
- `storeUtil.getAuditRecords()` → 待审核记录

**关键方法**：

- `_initRole()` → 初始化角色和权限
- `_categorizeDishes()` → 按分类对菜品分组
- `loadDashboardData()` → 加载仪表盘全部数据

**导航跳转**：

- `goToMenu()` → tabBar 菜单页
- `goToTask()` → tabBar 任务页
- `goToAudit()` → 审核页（仅 admin/buyer）
- `goToDishLibrary()` → 菜品库
- `goToAnalysis()` → 菜单分析

---

### 2.2 登录页 (`pages/login/login`)

**页面用途**：用户认证入口，支持三种登录方式。

**登录方式**：


| 方式     | 方法                      | 说明                                   |
| ------ | ----------------------- | ------------------------------------ |
| 微信一键登录 | `handleWechatLogin()`   | 获取 code → openid → 匹配已绑定员工           |
| 账号密码登录 | `handlePasswordLogin()` | 用户名+密码 → `store.authenticateStaff()` |
| 授权码绑定  | `handleBindCodeLogin()` | 6 位数字授权码绑定微信账号                       |


**登录后路由逻辑**（`_enterApp()`）：

1. 已登录 → 直接进入应用
2. 管理员无门店 → 跳转门店管理页
3. 无门店权限 → 提示联系管理员
4. 多个可访问门店 → 跳转门店选择页
5. 单个门店 → 直接跳转首页

**写入数据**：

- `wx.setStorageSync('token', token)`
- `wx.setStorageSync('userInfo', userInfo)`
- `wx.setStorageSync('userRole', userRole)`
- `wx.setStorageSync('staffInfo', staffInfo)`

---

### 2.3 菜单中心页 (`pages/menu/menu`) — 核心复杂页面

**页面用途**：菜单管理主页面，支持菜品增删改、智能推荐、评分、采购提交。

**核心功能模块**：

#### 2.3.1 菜单管理

- 日期切换查看不同日菜单
- 添加/编辑/删除菜品
- 每次修改自动保存 `storeUtil.saveMenu(date, menuData)`
- 原材料汇总计算 `_recalc()`（按菜品数量 × BOM 计算实际需求量）

#### 2.3.2 智能推荐算法 `_generateRecommendations()`

**多维度评分系统**：


| 维度    | 说明              |
| ----- | --------------- |
| 新鲜度加分 | 近 N 天未使用的菜品得分更高 |
| 毛利润加分 | 高毛利/中等/引流款分级加分  |
| 食材多样性 | 新食材加分，避免重复      |
| 分类均衡性 | 按当前菜单分类数量加减分    |
| 优先级加权 | 炒菜优先级高，汤品低      |
| 白名单权重 | 指定食材的分段权重调整     |


**三种推荐模式**：

1. 均衡搭配
2. 偏重高毛利
3. 食材多样

#### 2.3.3 评分系统

评分由 `menuScorer.scoreMenu()` 计算，4 个维度满分 100：


| 维度    | 权重   | 说明          |
| ----- | ---- | ----------- |
| 菜单完整度 | 30 分 | 按分类标准检查是否齐全 |
| 食材多样性 | 30 分 | 食材属性覆盖度     |
| 菜品新鲜度 | 20 分 | 近期重复度       |
| 毛利润结构 | 20 分 | 高/中/引流菜品均衡  |


评分等级：S(90+), A(75-89), B(60-74), C(<60)

#### 2.3.4 角色权限


| 功能     | chef | chef_head | buyer | admin |
| ------ | ---- | --------- | ----- | ----- |
| 添加菜品   | ✓    | ✓         | ✓     | ✓     |
| 智能推荐   | ✓    | ✓         | ✓     | ✓     |
| 查看评分   |      | ✓         | ✓     | ✓     |
| 提交采购审核 |      |           | ✓     | ✓     |


**导航**：

- `/pages/dish-edit/dish-edit` — 菜品编辑
- `/pages/analysis/analysis` — 菜单分析
- `/pages/dish-library/dish-library` — 菜品库

---

### 2.4 任务管理页 (`pages/task/task`)

**页面用途**：管理补货任务，分为自动生成（基于菜单 BOM）和手动添加两种。

**任务生成逻辑**：

- `_generateTasksFromMenu()` → 从菜单 BOM 自动汇总所有原材料需求
- `_stableId(material, unit)` → 生成稳定的任务 ID（食材名+单位的哈希）
- 手动任务支持数量覆盖

**任务管理**：

- 完成状态切换（完成/未完成）
- 编辑模式批量删除
- 任务数量编辑和单位选择
- 日期切换查看不同日任务

**筛选功能**：全部 / 待完成 / 已完成

**数据读写**：

- 读取：`storeUtil.getManualTasks(date)`、`storeUtil.getCompletedTaskIds(date)`、`storeUtil.getMenu(date)`
- 写入：`storeUtil.saveManualTasks(date, tasks)`、`storeUtil.saveCompletedTaskIds(date, ids)`

---

### 2.5 审核管理页 (`pages/audit/audit`)

**页面用途**：采购审核和菜品审核管理。

**审核类型**：


| 类型             | 说明                                | 操作者   |
| -------------- | --------------------------------- | ----- |
| purchase（采购审核） | 审核采购清单，修改数量，通过后菜单状态变为 `purchased` | buyer |
| dish（菜品审核）     | 审核菜品变更，通过后清除临时标记                  | admin |


**审批操作**：

- 通过：记录审批时间和审批人
- 拒绝：需填写拒绝原因

**数据补充**：若审核记录缺少菜品明细，自动从菜单数据中补充。

**UI 模式**：

- Tab 切换（采购审核/菜品审核）
- 筛选（全部/待审核/已批复/已拒绝）
- 展开收起采购单详情
- 切换明细页签（采购明细/菜单明细）
- 实时编辑采购数量

---

### 2.6 食材库页面 (`pages/ingredients/ingredients`)

**页面用途**：食材信息管理，CRUD + 品类管理 + 单位管理。

**核心功能**：

- 食材增删改查
- 品类管理（新增、重命名、排序）
- 单位管理
- 分类筛选和搜索

**权限控制**：


| 操作  | chef | chef_head | buyer | admin |
| --- | ---- | --------- | ----- | ----- |
| 查看  | ✓    | ✓         | ✓     | ✓     |
| 编辑  |      | ✓         | ✓     | ✓     |
| 删除  |      |           | ✓     | ✓     |


**自动修复机制**：

- 分类列表损坏时自动重置
- 修复食材 `category` 字段与分类列表的不一致
- 确保默认分类不被误删

---

### 2.7 菜品库页面 (`pages/dish-library/dish-library`)

**页面用途**：菜品信息管理，CRUD + BOM 配方编辑 + 毛利润管理。

**核心功能**：

- 菜品 CRUD（含分类筛选、搜索）
- BOM 配方管理（主料 `mainIngredients` + 辅料 `subIngredients`）
- 毛利润设置（高毛利/中等/引流款）
- 相似菜品检测 `_checkSimilarDishes()`
- 新增菜品自动添加审核记录

**数据迁移**：支持 v1 分类迁移（`CATEGORY_MIGRATION` 映射）。

**UI 模式**：

- 底部弹窗编辑
- `ingredient-picker` 组件选择食材
- BOM 预览展开/收起
- 相似菜品实时提示

---

### 2.8 菜品编辑页 (`pages/dish-edit/dish-edit`)

**页面用途**：菜品配方详细编辑。

**双模式支持**：

- 编辑模式：传入 `dishId`，从菜品库加载已有数据
- 新建模式：`id = Date.now()`，标记 `isTemp: true`

**BOM 格式**：

- `mainIngredients` — 主料列表 `[{ingredientId, ingredientName, unit, recommendedQty}]`
- `subIngredients` — 辅料列表（同结构）
- 兼容旧 `bom` 字段自动迁移

**页面间通信**：编辑成功后通过页面实例方法通知菜单页刷新。

---

### 2.9 菜品分析页 (`pages/analysis/analysis`)

**页面用途**：分析历史菜单数据和菜品使用情况。

**分析维度**：

- 总览（时间范围内统计）
- 食材排行（使用量排名）
- 菜品排行（出现频次排名）
- 毛利分析（高/中/引流/未设置分布）
- 分类分布（各类别占比）

**时间范围**：近 7 天 / 近 30 天 / 自定义

**关键计算**：

- 食材使用统计：按 BOM 用量 × 菜品份数汇总
- 毛利分布：高毛利/中等/引流款的数量和百分比
- 分类分布：按 `CATEGORY_DEFS` 颜色映射

---

### 2.10 算法配置页 (`pages/algorithm-config/algorithm-config`)

**页面用途**：配置菜品推荐算法参数。

**可配置项**：

- 新鲜度参数：`freshnessBonus`、`freshnessPenalty`
- 毛利参数：`profitHighBalance` 等
- 多样性参数：`diversityBonusHigh`
- 白名单规则：食材重复权重

**AI 调参助手**：

- 自然语言输入解析（如"增加白名单中XX的权重"）
- `parseWhitelistIntent()` 解析白名单意图
- 支持白名单增删改操作

**权限**：仅 admin、chef_head、buyer 可访问。

---

### 2.11 个人中心页 (`pages/profile/profile`)

**页面用途**：用户个人中心，展示信息和功能入口。

**显示内容**：

- 用户头像（支持更换）
- 角色信息
- 菜品数量统计
- 待完成任务数

**按角色显示快捷入口**：

- 厨师：菜品库、每日菜单、补货任务
- 厨师长：+ 食材库、创建补货任务、提交采购审核
- 采购员：审核采购清单、修改采购数量、食材库
- 管理员：全部门户

---

### 2.12 门店管理页 (`pages/store-manage/store-manage`)

**页面用途**：管理所有门店列表，支持 CRUD 和门店切换。

**核心功能**：

- 门店列表展示（卡片式）
- 创建/编辑/删除门店
- 切换当前门店（自动跳转首页）
- 权限：仅 admin 可创建/编辑/删除

**数据操作**：

- `storeUtil.createStore()` / `updateStore()` / `deleteStore()`
- `storeUtil.setStoreId()` — 切换门店
- `storeUtil.getAccessibleStores()` — 获取有权限的门店

---

### 2.13 门店详情页 (`pages/store-detail/store-detail`)

**页面用途**：展示单个门店详细信息和运营统计。

**统计数据**：

- 待完成任务数 = 菜单 BOM 物料 + 手动任务 - 已完成
- 近 7 天菜单天数和菜品份数

**快捷跳转**：菜单页 / 任务页 / 审核页（根据角色权限控制）

---

### 2.14 员工管理页 (`pages/staff-manage/staff-manage`)

**页面用途**：管理所有员工账号，支持创建/编辑/停用/授权码绑定。

**核心功能**：

- 员工列表（按角色和门店分组）
- 创建/编辑员工（分配角色和门店）
- 停用员工
- 授权码生成（6 位数字，5 分钟有效，倒计时显示）
- 微信绑定/解绑

**数据操作**：

- `storeUtil.createStaff()` / `updateStaff()` / `deleteStaff()`
- `storeUtil.generateBindCode()` — 生成授权码
- `storeUtil.verifyAndBind()` — 验证并绑定

---

### 2.15 菜单标准配置页 (`pages/menu-standard/menu-standard`)

**页面用途**：配置门店菜单标准结构和每日默认菜品。

**核心功能**：

- 菜单标准：每个分类的最少菜品数量
- 默认菜品：按星期配置，每日可不同
- 菜品搜索（模糊搜索 + 去重）
- 批量操作（复制到其他日期、清空当日）

**数据操作**：

- `menuScorer.getMenuStandard()` / `saveMenuStandard()`
- `menuScorer.getDefaultDishesByDay()`
- `menuScorer.addDefaultDish()` / `removeDefaultDish()`

**权限**：仅 chef_head 和 admin 可修改。

---

### 2.16 数据导入页 (`pages/data-import/data-import`)

**页面用途**：批量导入食材或菜品数据，支持 Excel 解析。

**5 步导入流程**：

1. 选择导入类型（食材/菜品）
2. 选择文件
3. 数据验证和预览
4. 选择导入模式（合并/替换）
5. 执行导入

**权限**：仅 admin 可访问。

---

### 2.17 数据初始化页 (`pages/data-init/data-init`)

**页面用途**：初始化系统基础数据，支持本地数据迁移到云端。

**核心功能**：

- 云开发状态检查
- 数据库连接检测
- 数据迁移执行
- 默认测试数据初始化

**权限**：仅 admin 可执行。

---

## 3. 组件详解

### 3.1 bottom-modal — 底部弹窗

**用途**：通用底部弹出式模态对话框，支持多 slot。


| 属性           | 类型      | 默认值      | 说明                 |
| ------------ | ------- | -------- | ------------------ |
| show         | Boolean | false    | 是否显示               |
| title        | String  | ''       | 弹窗标题               |
| maxHeight    | String  | '85vh'   | 最大高度               |
| position     | String  | 'bottom' | 显示位置：bottom/center |
| showCancel   | Boolean | true     | 显示取消按钮             |
| cancelText   | String  | '取消'     | 取消按钮文字             |
| confirmText  | String  | '确认'     | 确认按钮文字             |
| showFooter   | Boolean | true     | 显示底部按钮             |
| maskClosable | Boolean | true     | 点击遮罩关闭             |


**事件**：`cancel`、`confirm`、`close`

---

### 3.2 filter-bar — 筛选栏

**用途**：横向筛选标签栏。


| 属性          | 类型      | 默认值   | 说明                     |
| ----------- | ------- | ----- | ---------------------- |
| items       | Array   | []    | 筛选项 `[{value, label}]` |
| activeValue | String  | ''    | 当前选中值                  |
| type        | String  | 'tag' | 显示样式：tag/button        |
| scrollable  | Boolean | false | 是否可横向滚动                |


**事件**：`change` → `{ value }`

---

### 3.3 search-bar — 搜索栏

**用途**：通用搜索输入框。


| 属性          | 类型      | 默认值     | 说明     |
| ----------- | ------- | ------- | ------ |
| value       | String  | ''      | 输入值    |
| placeholder | String  | '搜索...' | 占位文本   |
| showAction  | Boolean | false   | 显示右侧按钮 |
| actionText  | String  | '搜索'    | 按钮文字   |


**事件**：`input`、`action`、`focus`、`blur`

---

### 3.4 empty-state — 空状态

**用途**：显示空数据占位。


| 属性   | 类型     | 默认值    | 说明       |
| ---- | ------ | ------ | -------- |
| icon | String | ''     | 图标 emoji |
| text | String | '暂无数据' | 主文案      |
| hint | String | ''     | 辅助提示     |


---

### 3.5 form-row — 表单行

**用途**：通用表单输入行，支持多种输入类型。


| 属性          | 类型     | 默认值        | 说明                          |
| ----------- | ------ | ---------- | --------------------------- |
| label       | String | ''         | 标签文字                        |
| type        | String | 'input'    | 输入类型：input/picker/textarea  |
| value       | String | ''         | 当前值                         |
| placeholder | String | ''         | 占位文字                        |
| inputType   | String | 'text'     | input 子类型：text/number/digit |
| pickerMode  | String | 'selector' | picker 模式                   |
| range       | Array  | []         | picker 选项数组                 |
| rangeKey    | String | ''         | 选项显示字段                      |
| pickerIndex | Number | 0          | 默认选中索引                      |
| prefix      | String | ''         | picker 前缀                   |


**事件**：`input`、`pickerchange`

---

### 3.6 ingredient-picker — 食材选择器

**用途**：食材选择弹窗，支持搜索和过滤。


| 属性          | 类型      | 默认值    | 说明             |
| ----------- | ------- | ------ | -------------- |
| show        | Boolean | false  | 是否显示           |
| title       | String  | '选择食材' | 弹窗标题           |
| ingredients | Array   | []     | 食材列表（全量）       |
| filterType  | String  | ''     | 过滤：main/sub/'' |
| groupType   | Boolean | false  | 是否按类型分组        |


**事件**：`select` → `{ ingredient }`、`close`

**内部逻辑**：

- 监听 `show/ingredients/filterType` 变化自动重置搜索
- 支持按名称模糊搜索
- 支持按类型过滤和分组显示

---

### 3.7 action-bar — 操作栏

**用途**：底部操作栏容器。


| 属性    | 类型      | 默认值   | 说明      |
| ----- | ------- | ----- | ------- |
| fixed | Boolean | false | 是否固定在底部 |


纯 slot 容器组件，预留扩展。

---

### 3.8 score-fab — 评分浮窗

**用途**：可拖动的菜单评分悬浮按钮，实时显示评分。


| 属性             | 类型     | 默认值     | 说明             |
| -------------- | ------ | ------- | -------------- |
| dishes         | Array  | []      | 菜品列表           |
| date           | String | ''      | 菜单日期           |
| status         | String | 'draft' | 菜单状态           |
| defaultDishIds | Array  | []      | 默认菜品 ID（评分时排除） |
| panelTitle     | String | '菜单评分'  | 面板标题           |


**内部逻辑**：

- `attached()` → 初始化浮窗位置（右下角）
- `observers.dishes` → 监听菜品变化，自动调用 `menuScorer.scoreMenu()` 计算
- `_getGrade(percentage)` → 返回等级样式类名
  - S 级（90%+）：grade-s
  - A 级（75-89%）：grade-a
  - B 级（60-74%）：grade-b
  - C 级（<60%）：grade-c

**拖动逻辑**：

- `onTouchStart` → 记录起始位置，激活防穿透遮罩
- `onTouchMove` → 计算位移，限制在屏幕内
- `onTouchEnd` → 未移动则视为点击（展开/收起面板），已移动则吸附到左右边缘

---

## 4. 工具模块

### 4.1 utils/store.js — 数据存储层

**核心职责**：门店隔离的数据存储 + 员工管理。

**门店隔离**：所有数据操作自动附加 `storeId` 前缀，确保门店间数据互不干扰。

**员工管理**：

- 账号创建和认证（`authenticateStaff`）
- OpenID 查询（`getStaffByOpenId`）
- 权限验证（角色和门店归属）
- 授权码绑定机制（6 位数字，5 分钟有效）

**数据迁移**：

- `initDefaultStaff()` — 创建默认 admin 账号
- `migrateOldData()` — 旧数据结构迁移

### 4.2 utils/menu-scorer.js — 菜单评分引擎

**评分维度（满分 100）**：


| 维度    | 满分  | 计算方式              |
| ----- | --- | ----------------- |
| 菜单完整度 | 30  | 按分类标准检查各类别是否达标    |
| 食材多样性 | 30  | 食材属性（荤/素/海鲜等）的覆盖度 |
| 菜品新鲜度 | 20  | 基于时间窗口的重复度扣分      |
| 毛利润结构 | 20  | 高/中/引流菜品比例均衡度     |


**关键方法**：

- `scoreMenu(dishes, date, standard, rules, defaultDishIds)` — 计算评分
- `saveScore(date, result)` — 保存评分记录
- `getScoreRecord(date)` — 读取历史评分
- `getMenuStandard()` / `saveMenuStandard()` — 菜单标准配置
- `getDefaultDishesByDay()` — 获取默认菜品

### 4.3 utils/algorithm-config.js — 算法配置管理

**配置结构**：

```javascript
{
  freshnessBonus: Number,      // 新鲜度加分
  freshnessPenalty: Number,    // 新鲜度扣分
  profitHighBalance: Number,   // 高毛利平衡
  profitMediumBalance: Number, // 中等毛利平衡
  diversityBonusHigh: Number,  // 多样性高分加分
  ingredientWhitelist: Array<{ // 食材白名单规则
    ingredientName: String,
    thresholdDishCount: Number,
    preThresholdWeight: Number,
    repeatWeight: Number,
  }>,
}
```

**关键方法**：

- `getConfig()` — 获取当前配置
- `getDefaultConfig()` — 获取默认配置
- `saveConfig(config)` — 保存配置

### 4.4 utils/cloud.js & cloud-db.js — 云数据库层

**云数据库集合**：dishes、ingredients、menus、tasks、audits、stores、staff

**核心功能**：

- 统一 CRUD 接口
- 所有操作支持 `storeId` 参数（门店隔离）
- `migrateLocalData()` — 本地数据批量迁移到云端
- 保持与本地 Storage 结构一致的接口设计

---

## 附录：页面导航关系图

```
login ──→ index（首页仪表盘）
            ├── menu（tabBar：菜单中心）
            │     ├── dish-edit（菜品编辑）
            │     ├── dish-library（菜品库）
            │     └── analysis（菜品分析）
            ├── task（tabBar：任务管理）
            ├── audit（审核管理）
            ├── dish-library（菜品库）
            ├── ingredients（食材库）
            ├── algorithm-config（算法配置）
            └── profile（个人中心）
                  ├── store-manage（门店管理）[admin]
                  │     └── store-detail（门店详情）
                  ├── staff-manage（员工管理）[admin]
                  ├── menu-standard（菜单标准）
                  ├── data-import（数据导入）[admin]
                  └── data-init（数据初始化）[admin]
```

