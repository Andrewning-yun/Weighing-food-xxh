# Fastfood Kitchen P1 任务清单：客单价反馈系统 + 菜品推荐增强

生成日期：2026-04-13

状态标记：`[x]` 已完成，`[ ]` 待执行，`[~]` 进行中

## Step 7 数据层：新增表与字段迁移
- [x] T7.1 创建迁移文件 `20260413000000-add-recommendation-system.ts`
- [x] T7.2 `Store` 表新增字段：`targetTicketPriceBreakfast/Lunch`、`pricePerLiang`、`memberPricePerLiang`、`ricePrice`
- [x] T7.3 创建 `daily_metrics` 表
- [x] T7.4 创建 `dish_feedback` 表
- [x] T7.5 创建 `menu_standards` 表
- [x] T7.6 创建 `default_dishes` 表
- [x] T7.7 创建 `algorithm_config` 表
- [x] T7.8 创建 `dish_type_tags` 表
- [x] T7.9 创建 `menu_pairing_rules` 表
- [x] T7.10 创建 `ai_suggestions` 表
- [ ] T7.11 运行真实 Postgres 迁移验证

## Step 8 后端：实体与 Module
- [x] T8.1 `DailyMetric` 实体 + Module/Controller/Service
- [x] T8.2 `DishFeedback` 实体 + Module/Controller/Service
- [x] T8.3 `MenuStandard` 实体 + Module/Controller/Service
- [x] T8.4 `DefaultDish` 实体 + Module/Controller/Service
- [x] T8.5 `AlgorithmConfig` 实体 + Module/Controller/Service
- [x] T8.6 `DishTypeTag` 实体 + Module/Controller/Service
- [x] T8.7 `MenuPairingRule` 实体 + Module/Controller/Service
- [x] T8.8 `AiSuggestion` 实体 + Module/API 预留
- [x] T8.9 `Store Module` 支持新字段读写
- [x] T8.10 `Dish Module` 支持 `dishTypeTag` 自动判定与手动覆盖

## Step 9 后端：推荐算法增强
- [x] T9.1 重构 `CostingService.getRecommendations()` 为多维度评分架构
- [x] T9.2 实现 `ticketPriceBonus`
- [x] T9.3 实现 `pairingBonus`
- [x] T9.4 实现 `feedbackBonus`
- [x] T9.5 实现 `diversityBonus`
- [x] T9.6 实现 `categoryBonus`
- [x] T9.7 实现白名单排除：`default_dishes` 不参与推荐排序
- [x] T9.8 实现菜单评分引擎：完整度 / 多样性 / 新鲜度 / 毛利结构
- [x] T9.9 实现算法参数从 `algorithm_config` 读取
- [x] T9.10 `reasons` 增加客单价 / 搭配 / 反馈等原因说明

## Step 10 后端：菜品分类标签自动判定
- [x] T10.1 实现标签判定服务
- [x] T10.2 默认标签组种子数据：大荤 / 小荤 / 素菜
- [x] T10.3 菜品保存时自动计算并缓存 `dishTypeTag`
- [x] T10.4 提供手动覆盖接口

## Step 11 后端：种子数据与初始配置
- [x] T11.1 默认菜单标准种子数据
- [x] T11.2 默认搭配规则种子数据
- [x] T11.3 默认算法配置种子数据
- [x] T11.4 默认菜品分类标签种子数据

## Step 12 Web Admin 前端
- [x] T12.1 门店编辑表单增加目标客单价 / 称重单价 / 米饭价格
- [x] T12.2 新增页面：每日经营数据
- [x] T12.3 新增页面：菜品反馈
- [x] T12.4 新增页面：菜单标准配置
- [x] T12.5 新增页面：每日默认菜品配置
- [x] T12.6 新增页面：算法参数配置
- [x] T12.7 新增页面：菜品分类标签管理
- [x] T12.8 新增页面：搭配规则配置
- [x] T12.9 菜品页面支持 `dishTypeTag` 展示与手动修改

## Step 13 小程序前端
- [x] T13.1 首页增加填报提醒卡片
- [x] T13.2 新增页面：每日填报
- [x] T13.3 填报页增加菜品剩余反馈
- [x] T13.4 分析页展示新增推荐原因与分数
- [x] T13.5 菜单规划页展示菜单评分与搭配缺口
- [x] T13.6 门店管理页展示新增价格字段（只读）

## Step 15 Bug 修复（验收发现）
- [x] T15.1 修复 `UpsertDefaultDishesDto` 中 `dishName` 的 `@IsOptional()` 在嵌套验证下不生效问题，改用 `@ValidateIf` 方案
- [x] T15.2 修复 `DefaultDishService.upsert()` 中 `findByIds` 改为 `findBy({ id: In([...]) })`，使 `dishName` 自动补全生效
- [x] T15.3 验证修复后 `dishName` 不传 / 传 `null` / 传空串时均能正常保存并自动回填菜名

## Step 14 集成验证
- [x] T14.1 全量 `build / lint / test` 通过
- [ ] T14.2 真实 Postgres 迁移验证
- [x] T14.3 后端冒烟：新增 API CRUD / 查询正常
- [x] T14.4 推荐算法验证：多维度评分与 `reasons` 正常
- [x] T14.5 白名单验证：固定菜不出现在推荐列表且评分排除
- [x] T14.6 菜单评分验证：4 维度评分正常返回
- [ ] T14.7 填报流程验证：填报 -> 偏差计算 -> 次日推荐调整
- [x] T14.8 Web Admin 新页面可访问并可保存
- [x] T14.9 小程序提醒 / 填报 / 评分展示正常
- [ ] T14.10 端到端业务流人工验收
