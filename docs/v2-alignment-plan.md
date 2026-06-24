# V2 对齐 V1 — 实施计划

> 更新时间：2026-04-16
> 状态：待实施
> 前序文档：`docs/v1-page-logic.md`（V1 页面逻辑参考）

---

## A. 开发约束（所有任务必须遵守）

本节列出全局约束。每个具体任务中不再重复这些约束的全文，但实施时必须遵守。违反任一条即视为不合格。

### A1. 文案

- 所有页面展示文案必须为中文。
- 页面中不出现英文按钮、英文标题、英文空状态。
- 页面中不出现"请到后台处理""当前版本如何如何""这是预留页"等说明式文案。
- 未开发完成的页面骨架允许留空，但只展示简洁中文标题、分区、空白容器或简短中文空状态。

### A2. 导航

- 小程序底部主导航统一固定为：`首页 / 菜单 / 任务 / 我的`。
- 底部导航用于页面切换，不作为装饰展示。
- 所有主页面底部导航样式与行为必须一致，不允许每个页面单独实现一套。
- 其他功能页不进入底部导航，统一通过 `首页` 和 `我的` 进入。

### A3. 交互

- 尽可能复用公共组件，不允许在多个页面重复实现同一类导航、浮窗、列表卡片、日期选择条等组件。
- 不要为了进入每个小功能都额外跳新页面。
- 能在当前主页面通过展开、弹层、浮窗、局部切换完成的，就不要拆成新的全屏页面。

### A4. 组件复用

本轮必须优先抽取和复用公共组件，至少包括：

| 组件 | 说明 |
|------|------|
| TabBar | 底部主导航，四页共用 |
| MenuActionBar | 菜单页顶部固定操作条（日期+餐段切换） |
| DatePickerPopup | 日期浮窗，滑动选择 |
| ScoreFab | 浮动评分按钮 |
| PopupPanel | 非全屏弹层容器 |
| HomeCard | 首页小卡片入口 |
| ProfileEntry | 个人中心列表入口 |

同类组件只维护一套主实现。

### A5. 入口样式区分

- **首页**：小卡片样式，高频工作功能入口（每日日报、库存填报、菜品库、数据分析）。
- **个人中心**：列表式样式，管理类/配置类/低频功能入口（门店管理、员工管理、算法配置、菜单标准、审核管理、数据导入、操作日志）。
- 两种入口样式必须区分，不能共用完全相同的视觉表现。

### A6. 开发节奏与完成标准

每个任务分两个阶段交付，阶段之间有明确的验收边界。

**第一阶段：骨架**

骨架阶段只做页面结构、入口、导航、布局和空状态。具体标准：

- 页面路由可访问，无报错白屏
- 页面布局（分区、列表位置、操作栏位置）与最终形态一致
- 入口按钮/卡片/列表项已渲染，点击可跳转或展开
- 弹层/浮窗/弹框可触发弹出，位置和尺寸正确
- 所有文案为中文，无英文、无开发说明
- 允许：列表为空、数据为 Mock 或空、操作按钮点击后无实际效果

**第二阶段：联调**

联调阶段接入真实数据和后端交互。具体标准：

- 所有数据从后端 API 获取并正确展示
- 所有操作按钮触发真实 API 调用
- 错误状态（加载失败、保存失败）有中文提示
- 权限控制生效（无权限角色看不到入口或看到拒绝提示）

**每个任务中的标记方式**：

- 标注「骨架」的任务内容 → 第一阶段必须完成
- 标注「联调」的任务内容 → 第二阶段必须完成
- 骨架不依赖后端新模块的任务 → 骨架阶段直接做完
- 骨架依赖后端新模块的任务 → 骨架阶段先做布局，联调阶段等后端就绪后再接入

---

## B. 任务清单（单一执行口径）

以下是唯一的任务编号体系，按执行顺序排列。每个任务中已嵌入该任务必须遵守的特定约束。

---

### T0. 登录页三模式对齐

**优先级**：0（最先启动，与 T1 可并行）
**类型**：重写登录页 + 后端新增
**文件**：`apps/miniapp/src/pages/login/index.tsx` + `index.scss`、`apps/miniapp/src/api/auth.ts`、`services/api/src/modules/auth/`

**现状**：V2 仅有用户名/密码登录，缺少微信一键登录和授权码绑定。

**三种登录模式**（对齐 V1）：

1. **微信一键登录**（默认模式）：调用 `wx.login()` 获取 code → 后端通过 code 换取 openid → 匹配已绑定员工 → 自动登录
2. **用户名/密码登录**：保留现有逻辑，用户名 + 密码 → `POST /auth/login`
3. **授权码绑定**：输入 6 位绑定码 → 绑定当前微信 openid 到已有员工账号 → 绑定成功后自动登录

**前端**：
- 三个登录模式通过 Tab 或滑动切换展示
- 默认显示微信一键登录（已绑定用户直接登录，未绑定提示先绑定）
- 所有文案中文
- 登录失败显示中文错误提示

**后端新增**：
- `POST /auth/wx-login`：接收微信 code，换取 openid，匹配已绑定员工，返回 token
- `POST /auth/bind-code`：接收绑定码 + 微信 code，验证绑定码有效性，将 openid 绑定到员工，返回 token
- `POST /auth/generate-bind-code`：为已有员工生成 6 位绑定码（管理员操作）
- `GET /auth/bind-status`：查询当前微信 openid 是否已绑定员工

**骨架完成标准**：
- 登录页可访问，三种模式 Tab/切换布局正确
- 微信一键登录按钮可见
- 用户名/密码输入框布局正确（保留现有）
- 授权码输入框布局正确，包含 6 位输入和确认按钮
- 所有文案中文，无英文

**联调完成标准**：
- 微信一键登录：`wx.login()` → code → 后端换 token 成功
- 用户名/密码登录：保留现有逻辑正常工作
- 授权码绑定：输入绑定码 → 绑定成功 → 自动登录
- 未绑定微信时提示「请先绑定账号」
- 绑定码过期或无效时有中文提示
- 管理员可生成绑定码

---

### T1. 统一底部导航组件（TabBar）

**优先级**：1（最高，所有页面基础）
**类型**：新建公共组件
**文件**：`apps/miniapp/src/components/TabBar/index.tsx` + `index.scss`

**约束（来自 A2）**：
- 固定 4 项：首页 / 菜单 / 任务 / 我的
- 样式与行为完全一致，四页共用一套组件
- 不允许每个页面单独实现底部导航

**交付物**：index、menu-plan、tasks、my 四页全部切换为使用 TabBar 组件。

---

### T2. 首页入口重组

**优先级**：2
**类型**：修改 index 页
**文件**：`apps/miniapp/src/pages/index/index.tsx` + `.scss`

**约束（来自 A5）**：
- 使用 HomeCard 小卡片样式
- 样式必须与个人中心列表式入口区分

**新增卡片入口**：

| 入口 | 跳转 | 可见角色 |
|------|------|---------|
| 每日日报 | `/pages/daily-report/index` | admin、store_manager |
| 库存填报 | `/pages/inventory/index` | admin、chef_manager、prep |
| 菜品库 | `/pages/dishes/index` | 所有角色 |
| 数据分析 | `/pages/analysis/index` | 所有角色 |

---

### T3. 个人中心入口重组

**优先级**：3
**类型**：修改 my 页
**文件**：`apps/miniapp/src/pages/my/index.tsx` + `.scss`

**约束（来自 A5）**：
- 使用 ProfileEntry 列表式样式
- 样式必须与首页小卡片入口区分

**新增列表入口**：

| 入口 | 跳转 | 可见角色 |
|------|------|---------|
| 门店管理 | `/pages/store-manage/index` | admin |
| 员工管理 | `/pages/staff-manage/index` | admin |
| 算法配置 | `/pages/algorithm-config/index`（T16 新建） | admin、chef_manager、buyer |
| 菜单标准 | `/pages/menu-standard/index`（T17 新建） | chef_manager、admin |
| 审核管理 | `/pages/audit/index`（T14 新建） | admin、store_manager、buyer |
| 数据导入 | `/pages/data-import/index`（T15 新建） | admin |
| 操作日志 | `/pages/operation-log/index`（T13 改造） | admin、store_manager |

---

### T4. 菜单页顶部固定操作条（MenuActionBar）

**优先级**：4
**类型**：新建公共组件 + 修改 menu-plan 页
**文件**：`apps/miniapp/src/components/MenuActionBar/index.tsx` + `index.scss`
**依赖**：T1（TabBar）

**约束**：
- 顶部操作条固定不随页面滚动
- 左侧：日期按钮
- 右侧：早餐 / 正餐切换按钮
- 不再使用"按整周横向平铺日期"的方式
- 这一行不占整页大面积空间
- 滚动时保持固定

**交付物**：menu-plan 页移除现有的整周日期横铺，替换为 MenuActionBar 组件。

---

### T5. 日期浮窗（DatePickerPopup）

**优先级**：5
**类型**：新建公共组件
**文件**：`apps/miniapp/src/components/DatePickerPopup/index.tsx` + `index.scss`
**依赖**：T4（MenuActionBar 中的日期按钮触发此组件）

**约束**：
- 点击左上角日期按钮后弹出
- 支持滑动选择日期
- 选择完成后刷新当前菜单内容
- 不跳转独立页面

---

### T6. 推荐菜按钮与搜索栏

**优先级**：6
**类型**：修改 menu-plan 页
**文件**：`apps/miniapp/src/pages/menu-plan/index.tsx` + `.scss`
**依赖**：T4（顶部固定栏）、已有 `GET /costing/recommendations` API

**约束**：
- 搜索栏放在菜单编辑区顶部
- 搜索栏右侧放置「推荐菜」按钮
- 推荐菜不放进评分浮窗弹层（独立入口）
- 搜索结果和推荐菜点击后直接加入菜单
- 加入后在菜单内调整数量
- 不再在最下方整块列出所有可添加菜品

**搜索栏**：关键词检索菜品 → 结果点击直接加入菜单

**推荐菜按钮**：
- 点击弹出推荐菜品列表
- 模式切换：均衡搭配 / 高毛利 / 食材多样
- 每项：菜品名、分类、评分、推荐理由、库存状态
- 点击直接加入菜单

---

### T7. 菜单评分浮窗（ScoreFab）

**优先级**：7
**类型**：新建公共组件
**文件**：`apps/miniapp/src/components/ScoreFab/index.tsx` + `index.scss`
**依赖**：T4（menu-plan 页引入）、已有 `POST /menu-score` API

**约束**：
- 仅存在于菜单页面中，不放到其他页面
- 右下角显示带外显分数的圆形浮窗
- 可拖动
- 初始位置在右下方，不贴底部导航上方边缘
- 点击弹出非全屏弹层（使用 PopupPanel 组件），不跳独立页面
- 弹层内容：总分 + 各维度分数 + 搭配缺口
- 推荐菜品列表不属于弹层内容（与 T6 分离）

**Props**：dishes、date、mealType、storeId
**等级**：S(90+) / A(75-89) / B(60-74) / C(<60)，对应不同颜色

---

### T8. 菜品库页内展开

**优先级**：9
**类型**：修改 dishes 页
**文件**：`apps/miniapp/src/pages/dishes/index.tsx` + `.scss`

**约束（来自 A3）**：
- 列表点击后在当前页内展开详情，不跳独立页面
- `dishes-detail` 仅保留为备用页，不作为主流程入口

**展开内容**：基础信息、成本与售价、食材列表、步骤列表

---

### T9. 菜品编辑页实现

**优先级**：骨架阶段可先行，审核联调依赖 T18（审核管理模块后端）
**类型**：重写占位页
**文件**：`apps/miniapp/src/pages/dish-edit/index.tsx` + `.scss`
**依赖**：`POST/GET/PATCH /dishes`、`GET /ingredients`、`GET /dish-type-tags`；审核联调需 T18

**编辑区块**：
1. **基础信息**：名称、分类、餐段、工位、推荐权重(1-3)
2. **BOM 配方**：主料 + 辅料列表（食材搜索选择、用量、单位、损耗率），支持添加/删除
3. **毛利设置**：高毛利/中等/引流款，基于成本自动建议售价
4. **分类标签**：关联大荤/小荤/素菜
5. **食材属性自动提取**：遍历 BOM 汇总关联属性

**双模式**：新建（`POST`）+ 编辑（`PATCH`）。新建菜品提交后进审核流程（T18）。

**骨架完成标准**：
- 页面路由 `/pages/dish-edit/index` 可访问，无报错白屏
- 5 个编辑区块（基础信息、BOM 配方、毛利设置、分类标签、食材属性）布局完整，输入框/下拉框/列表位置正确
- BOM 食材选择弹窗可弹出，位置和尺寸正确
- 顶部保存按钮可见，点击可触发（允许无实际效果）
- 所有文案中文，无英文

**联调完成标准**：
- 新建菜品 `POST /dishes` 成功并进入审核流程
- 编辑菜品 `PATCH /dishes/:id` 成功
- BOM 食材搜索 `GET /ingredients` 返回真实数据并可选择
- 分类标签 `GET /dish-type-tags` 加载正确
- 食材属性根据 BOM 自动提取
- 审核提交后状态正确（依赖 T18）
- 保存失败有中文错误提示

---

### T10. 菜品分析页

**优先级**：骨架先行，数据联调依赖 T20（菜品分析统计 API）
**类型**：重写 analysis 页
**文件**：`apps/miniapp/src/pages/analysis/index.tsx` + `.scss`
**依赖**：T20（分析统计 API）
**允许访问角色**：所有角色（admin、store_manager、chef_manager、chef、prep、buyer、breakfast_chef、breakfast_asst），与 T2 首页入口、T25 权限矩阵一致。

**Tab**：总览 / 食材排行 / 菜品排行 / 毛利分析
**时间范围**：近 7 天 / 近 30 天 / 自定义
**维度**：食材使用排行（BOM×份数）、菜品频次、毛利分布（高/中/引流/未设置百分比）

**骨架完成标准**：
- 页面路由可访问，无报错白屏
- 4 个 Tab（总览/食材排行/菜品排行/毛利分析）可切换，切换后对应内容区正确显示
- 时间范围选择器（近 7 天/近 30 天/自定义）布局正确，可点击
- 自定义时间范围弹窗可弹出
- 各 Tab 内容区有空状态中文提示
- 所有文案中文

**联调完成标准**：
- 4 个分析端点 `GET /costing/analysis/*` 数据正确展示
- 时间范围筛选生效，数据随参数变化
- 空数据时显示中文空状态
- 加载/失败有中文提示
- 依赖 T20 完成后进行

---

### T11. 门店详情 + 门店切换

**优先级**：骨架先行
**类型**：修改 store-manage 页
**文件**：`apps/miniapp/src/pages/store-manage/index.tsx` + `.scss`

**约束（来自 A3）**：
- 门店卡片点击展开详情面板，不跳独立页面
- V1 的 store-detail 功能合并到此页

**详情内容**：门店信息 + 价格体系 + 运营统计（近 7 天菜单天数、菜品份数、待完成任务数）
**快捷跳转**：菜单页 / 任务页 / 审核页
**门店切换**：「切换到此门店」按钮 → 切换 storeId → 刷新全局
**数据隔离**：确保资料库按门店独立

**骨架完成标准**：
- 门店列表渲染正确，每项可点击
- 点击后展开详情面板，不跳独立页面
- 详情面板包含：门店信息区、价格体系区、运营统计区、快捷跳转按钮
- 「切换到此门店」按钮可见
- 展开面板位置、尺寸正确，收起/展开交互流畅
- 所有文案中文

**联调完成标准**：
- 门店列表 `GET /stores` 数据正确
- 运营统计（近 7 天菜单天数、菜品份数、待完成任务数）数据正确
- 快捷跳转（菜单页/任务页/审核页）跳转正确并携带 storeId
- 门店切换后全局 storeId 更新，相关页面数据刷新
- 切换失败有中文提示

---

### T12. 员工管理门店隔离

**优先级**：骨架先行
**类型**：修改 staff-manage 页 + 后端
**文件**：`apps/miniapp/src/pages/staff-manage/index.tsx`

- 员工列表按当前门店筛选
- 创建/编辑员工时绑定门店
- 后端 `GET /users` 新增 storeId 过滤参数

**骨架完成标准**：
- 员工列表页面可访问，列表项渲染正确
- 创建/编辑员工弹窗可弹出，包含门店绑定下拉框
- 门店下拉框位置正确

**联调完成标准**：
- 员工列表按当前门店 storeId 筛选，只显示本门店员工
- 创建/编辑员工时门店字段正确绑定
- `GET /users?storeId=xxx` 返回正确过滤数据
- 操作成功/失败有中文提示

---

### T13. 操作日志权限控制

**优先级**：骨架先行
**类型**：修改 operation-log 页
**文件**：`apps/miniapp/src/pages/operation-log/index.tsx`

- 页面加载检查 `getSessionUser().role`
- 允许：admin、store_manager
- 其他角色显示「无权限访问」

**骨架完成标准**：
- 页面可访问
- 无权限角色进入时显示「无权限访问」中文提示
- 有权限角色进入时列表布局正确

**联调完成标准**：
- `getSessionUser().role` 权限检查生效
- 仅 admin、store_manager 可正常查看操作日志
- 其他角色被阻止并看到中文提示

---

### T14. 审核管理页（小程序）

**优先级**：骨架先行，数据联调依赖 T18（审核管理模块后端）
**类型**：新建页面
**文件**：`apps/miniapp/src/pages/audit/index.tsx` + `index.scss`
**入口**：个人中心列表式（T3）
**依赖**：T18 审核模块 API

**骨架交付内容**：
- 页面路由可访问，无报错白屏
- 3 个 Tab（菜品审核/食材审核/菜单审核）可切换
- 状态筛选栏（全部/待审核/已通过/已拒绝）布局正确
- 审核列表为空状态，显示中文空提示
- 通过/拒绝按钮可见，点击可弹出确认弹窗（允许无实际效果）
- 拒绝原因弹窗可弹出，包含文本输入框和确认按钮
- 展开详情区域有变更前后对比布局（空数据即可）
- 所有文案中文

**联调交付内容**（依赖 T18）：
- `GET /audit` 数据加载，列表正确展示操作类型、目标名称、操作人、时间、状态
- `PATCH /audit/:id/approve` 通过操作生效，列表状态更新
- `PATCH /audit/:id/reject` 拒绝操作生效，拒绝原因保存
- 展开详情显示变更前/后字段对比
- 权限：admin、store_manager、buyer 可操作
- 加载/操作失败有中文提示

---

### T15. 数据导入页（小程序）

**优先级**：骨架先行，数据联调依赖 T19（数据导入模块后端）
**类型**：新建页面
**文件**：`apps/miniapp/src/pages/data-import/index.tsx` + `index.scss`
**入口**：个人中心列表式（T3）
**依赖**：T19 数据导入 API、xlsx npm 包

- 5 步流程：选类型 → 选文件 → 预览验证 → 选模式 → 执行
- 导入类型：菜品 / 食材
- 菜品：名称、分类、成本、食材列表（步骤暂不做）
- 食材：名称、分类、单位、单价、是否易腐
- 权限：仅 admin

**骨架完成标准**：
- 页面路由可访问，无报错白屏
- 5 步流程界面布局完整：选类型 → 选文件 → 预览验证 → 选模式 → 执行
- 每步有正确的内容区和操作按钮（下一步/上一步/取消）
- 文件选择区可见
- 预览验证区有表格布局（空数据即可）
- 模式选择区有合并/替换选项
- 执行步骤有进度提示
- 所有文案中文

**联调完成标准**（依赖 T19）：
- `POST /data-import/parse` 解析上传数据并返回预览
- `POST /data-import/execute` 执行导入
- 5 步流程每步数据流转正确
- 预览验证区展示真实解析数据
- 导入成功/失败有中文提示
- 权限：仅 admin 可操作

---

### T16. 算法配置页（小程序）

**优先级**：骨架先行
**类型**：新建页面
**文件**：`apps/miniapp/src/pages/algorithm-config/index.tsx` + `index.scss`
**入口**：个人中心列表式（T3）

**骨架交付内容**：
- 页面路由可访问，无报错白屏
- 5 个分组折叠区域（新鲜度/毛利/多样性/反馈/输出控制）可展开/收起
- 每个分组内参数列表布局正确，输入框/滑块位置正确
- 保存按钮 + 恢复默认按钮可见
- 底部 AI 调参助手区域：输入框 + 发送按钮 + 白名单规则列表布局（空数据即可）
- 变更状态提示（如「有未保存的修改」）位置正确
- 所有文案中文

**联调交付内容**：
- `GET /algorithm-config` 加载真实参数数据
- `PUT /algorithm-config` 保存变更成功
- 变更检测：修改后提示未保存，未修改时保存按钮禁用
- 恢复默认功能生效
- AI 调参助手：`parseWhitelistIntent()` 解析自然语言输入
- 白名单规则列表：增删改操作生效
- 权限：admin、chef_manager、buyer 可访问
- 操作失败有中文提示

---

### T17. 菜单标准页（小程序）

**优先级**：骨架先行
**类型**：新建页面
**文件**：`apps/miniapp/src/pages/menu-standard/index.tsx` + `index.scss`
**入口**：个人中心列表式（T3）

- 按门店和餐段配置分类数量标准
- Tab 切换早餐/正餐
- 调用 `GET/PUT /menu-standards`
- 权限：chef_manager、admin

**骨架完成标准**：
- 页面路由可访问，无报错白屏
- 门店选择下拉框布局正确
- 早餐/正餐 Tab 可切换
- 分类数量标准编辑表格布局正确（分类名 + 最少 + 最多），空数据即可
- 保存按钮可见
- 所有文案中文

**联调完成标准**：
- `GET /menu-standards` 加载当前门店和餐段的标准
- `PUT /menu-standards` 保存修改成功
- 门店切换后数据刷新
- 餐段切换后数据刷新
- 保存失败有中文提示
- 权限：chef_manager、admin 可访问

---

### T18. 审核管理模块（后端 API）

**优先级**：后端先行，T14 依赖此任务
**类型**：新建 API 模块
**文件**：`services/api/src/modules/audit/`（module/controller/service/entity/dto）

**Entity**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| storeId | string | 门店 ID |
| module | enum | dish / ingredient / menu_plan |
| action | enum | create / update / delete / publish |
| targetId | string | 操作目标 ID |
| targetName | string | 操作目标名称 |
| operatedBy | string | 操作人 userId |
| operatedByName | string | 操作人姓名 |
| before | JSON | 修改前快照 |
| after | JSON | 修改后快照 |
| status | enum | pending / approved / rejected |
| reviewedBy | string? | 审批人 |
| reviewedAt | Date? | 审批时间 |
| rejectReason | string? | 拒绝原因 |
| createdAt | Date | 创建时间 |

**API**：

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/audit` | 提交审核记录 | 内部调用 |
| GET | `/audit` | 查询列表（分页+筛选） | admin, store_manager, buyer |
| GET | `/audit/stats` | 统计 | admin, store_manager |
| PATCH | `/audit/:id/approve` | 通过 | admin, store_manager, buyer |
| PATCH | `/audit/:id/reject` | 拒绝 | admin, store_manager, buyer |

**触发点**：菜品修改 → dish.service、食材修改 → ingredient.service、菜单发布 → menu-plan.service

---

### T19. 数据导入模块（后端 API）

**优先级**：后端先行，T15 依赖此任务
**类型**：新建 API 模块
**文件**：`services/api/src/modules/data-import/`（module/controller/service/dto）

**API**：

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/data-import/parse` | 解析数据，返回预览+验证 | admin |
| POST | `/data-import/execute` | 执行导入（合并/替换） | admin |

**数据格式**：
- 菜品：`{ mode, type:"dish", items: [{ name, category, mealType, cost, ingredients: [{name,qty,unit}] }] }`
- 食材：`{ mode, type:"ingredient", items: [{ name, category, unit, pricePerUnit, isPerishable }] }`

---

### T20. 菜品分析统计 API

**优先级**：后端先行，T10 依赖此任务
**类型**：扩展 costing 模块
**文件**：`services/api/src/modules/costing/costing.controller.ts` + `costing.service.ts`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/costing/analysis/ingredient-usage` | 食材使用排行 |
| GET | `/costing/analysis/dish-frequency` | 菜品频次排行 |
| GET | `/costing/analysis/profit-distribution` | 毛利分布 |
| GET | `/costing/analysis/category-distribution` | 分类分布 |

参数：storeId, startDate, endDate, mealType

---

### T21. 菜品库全局共享改造

**优先级**：后端先行
**类型**：修改 dish 模块
**文件**：`services/api/src/modules/dish/dish.service.ts` + `dish.controller.ts`

- `GET /dishes` 不按 storeId 过滤（全局共享）
- `PATCH /dishes/:id` 核心字段修改走审核（T18）
- `DELETE /dishes/:id` 同样走审核
- `GET /users` 新增 storeId 过滤参数（配合 T12）

---

### T22. 审核管理页（Web 后台）

**类型**：新建页面
**文件**：`apps/web-admin/src/pages/audit.tsx`
**依赖**：T18（审核 API）
- 审核列表 + 筛选 + 变更前后对比 + 通过/拒绝
- 路由 `/audit`，添加到 ROUTES
- 权限：admin、store_manager、buyer

---

### T23. 数据导入页（Web 后台）

**类型**：新建页面
**文件**：`apps/web-admin/src/pages/data-import.tsx`
**依赖**：T19（导入 API）
- 文件上传 + 预览 + 验证 + 执行
- 路由 `/data-import`，添加到 ROUTES
- 权限：仅 admin

---

### T24. 菜品分析页（Web 后台）

**类型**：新建页面
**文件**：`apps/web-admin/src/pages/analysis.tsx`
**依赖**：T20（分析 API）
- 复用分析 API
- 食材排行 / 菜品排行 / 毛利分布 / 分类分布
- 路由 `/analysis`，添加到 ROUTES

---

### T25. 全局权限加固

**类型**：横切修改
**涉及**：所有页面 + API Guard

**小程序**：页面加载检查 `getSessionUser().role`，无权限提示并阻止
**Web 后台**：登录后按角色过滤 ROUTES + 页面级守卫
**API**：Guard 检查 JWT 角色，新增 `@Roles()` 装饰器

**权限矩阵**：

| 功能 | admin | store_manager | chef_manager | chef | prep | buyer | breakfast_chef | breakfast_asst |
|------|:-----:|:------------:|:-----------:|:----:|:----:|:-----:|:------------:|:-------------:|
| 菜单编辑 | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ |
| 智能推荐 | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | |
| 评分查看 | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | |
| 数据分析 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 审核管理 | ✓ | ✓ | | | | ✓ | | |
| 菜品编辑 | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | |
| 算法配置 | ✓ | | ✓ | | | ✓ | | |
| 菜单标准 | ✓ | | ✓ | | | | | |
| 数据导入 | ✓ | | | | | | | |
| 操作日志 | ✓ | ✓ | | | | | | |
| 每日日报 | ✓ | ✓ | | | | | | |
| 库存填报 | ✓ | | ✓ | | ✓ | | | |
| 默认菜品 | ✓ | | ✓ | | | | | |
| 搭配规则 | ✓ | | ✓ | | | | | |
| 菜品标签 | ✓ | | | | | | | |

---

## C. 执行顺序

按优先级排列。优先级 1-8 为严格串行，前一优先级未完成不启动下一优先级。优先级 9-10 起，**骨架可并行，联调需等依赖就绪**：多个前端页面的骨架布局可同时推进，但真实 API 联调必须在对应后端模块完成后才能开始。

| 优先级 | 任务 | 说明 |
|:------:|------|------|
| 0 | **T0** 登录页三模式对齐 | 与 T1 可并行，前后端同时启动 |
| 1 | **T1** 统一底部导航 | 所有页面基础 |
| 2 | **T2** 首页入口重组 | 依赖 T1 |
| 3 | **T3** 个人中心入口重组 | 依赖 T1 |
| 4 | **T4** 菜单页顶部固定操作条 | 依赖 T1 |
| 5 | **T5** 日期浮窗 | 依赖 T4 |
| 6 | **T6** 推荐菜按钮与搜索栏 | 依赖 T4 |
| 7 | **T7** 菜单评分浮窗 | 依赖 T4 |
| 8 | **T8** 菜品库页内展开 | 依赖 T1 |
| 9 | **T9-T17** 其余小程序页面骨架 | 并行，按 T2/T3 入口需要依次接入 |
| 10 | **T18-T21** 后端新增模块 | T14(审核页) 依赖 T18(审核API)，T15(导入页) 依赖 T19(导入API)，T10(分析页) 依赖 T20(分析API)，T9(菜品编辑) 依赖 T21(菜品共享) |
| 11 | **T22-T24** Web 后台补全 | T22(审核Web) 依赖 T18，T23(导入Web) 依赖 T19，T24(分析Web) 依赖 T20 |
| 12 | **T25** 全局权限加固 | 贯穿始终，最终验收前完成 |

**依赖链**：
- T18(审核API) → T14(审核页小程序) → T22(审核页Web)
- T19(导入API) → T15(导入页小程序) → T23(导入页Web)
- T20(分析API) → T10(分析页小程序) → T24(分析页Web)
- T21(菜品共享) → T9(菜品编辑)

---

## D. V1→V2 差异速查

### D1. 小程序端

| V1 页面 | V2 对应 | 本计划任务 |
|---------|--------|-----------|
| `login` | `login`（仅有用户名密码） | T0 登录页三模式对齐 |
| `index` | `index` | T2 入口重组 |
| `menu`（菜单中心） | `menu-plan` | T4+T5+T6+T7 菜单页全面改造 |
| `task` | `tasks` | 无需改动 |
| `ingredients` | `ingredients` | 无需改动 |
| `dish-library` | `dishes` | T8 页内展开 |
| `dish-edit` | `dish-edit`（占位） | T9 完整实现 |
| `analysis` | `analysis` | T10 多维度统计 |
| `profile` | `my` | T3 入口重组 |
| `store-manage` | `store-manage` | T11 门店详情+切换 |
| `store-detail` | — | T11 合并到门店管理 |
| `staff-manage` | `staff-manage` | T12 门店隔离 |
| `algorithm-config` | — | T16 新建 |
| `menu-standard` | — | T17 新建 |
| `audit` | — | T14 新建 |
| `data-import` | — | T15 新建 |
| `score-fab`（组件） | — | T7 新建 |
| `operation-log` | `operation-log` | T13 权限控制 |

### D2. 后端已有能力（无需重建）

菜单评分(`POST /menu-score`)、推荐算法(`GET /costing/recommendations`)、评分历史、菜品成本、操作日志、算法配置、菜单标准、搭配规则、默认菜品、各模块 CRUD、每日经营数据、菜品反馈、库存管理、任务管理。

### D3. Web 后台缺失

| 页面 | 任务 |
|------|------|
| 审核管理 | T22 |
| 数据导入 | T23 |
| 菜品分析 | T24 |

---

## E. 预估影响

| 类别 | 数量 |
|------|------|
| 新增文件 | ~32 个 |
| 修改文件 | ~21 个 |
| 新增数据库表 | 2 个（audit_records + auth 相关） |
| 新增 Migration | 1 个 |
| 新增 npm 依赖 | xlsx |

---

## F. 验证方式

1. `npm.cmd run build` 三个工作空间均通过（Windows 环境；Linux/macOS 环境为 `npm run build`）
2. 登录页三种模式均可正常登录（微信一键 / 用户名密码 / 授权码绑定）（T0）
3. 底部导航四页行为完全一致（T1）
4. 首页入口为小卡片，个人中心为列表式，视觉明确区分（T2/T3）
5. 菜单页顶部固定栏 + 日期浮窗 + 搜索推荐 + 评分浮窗全部就位（T4-T7）
6. 菜品库点击展开详情，不跳独立页（T8）
7. 每种角色登录验证可见功能和操作范围（T25 权限矩阵）
8. 审核流程：菜品/食材修改 → 提交审核 → 审批通过/拒绝
9. 数据导入：Excel → 预览 → 导入 → 验证数据
10. 评分浮窗：添加菜品 → 实时更新 → 拖动正常
11. 页面无英文、无开发说明文案（A1 文案约束）
