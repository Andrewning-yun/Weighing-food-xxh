# Fastfood Kitchen P1 开发计划：客单价反馈系统 + 菜品推荐增强

生成日期：2026-04-13

## 背景

### 业务模式
- 称重餐饮（荤素同价，按两计价，不同门店单价不同）
- 菜品放在餐线上，顾客自行夹取后称重计价
- 米饭单独计费（2-3 元/位），不参与菜品推荐评分
- 系统仅面向内部管理（厨师长、店长、采购等），不面向顾客

### v1 已有的功能（需迁移/借鉴）
- **菜单标准配置**：每个分类需要的菜品数量（蒸菜:6, 炒菜:10, 油炸:5...），门店隔离
- **每日默认菜品**：按星期几配置固定菜品
- **算法配置**：新鲜度/毛利/多样性/分类均衡等可调参数，食材白名单规则
- **菜单评分引擎**：4 维度评分（完整度 30 + 多样性 30 + 新鲜度 20 + 毛利结构 20）
- **AI 调参入口**：自然语言描述调参目标，系统解析并调整算法参数

### 本轮新增功能
- 客单价反馈系统：基于每日经营数据动态调整推荐算法
- 菜品大荤/小荤/素菜分类：可配置标签组，影响搭配判定
- 固定菜品白名单：不受推荐分影响的每日必出菜品
- 菜品历史表现评分：基于剩余量反馈影响推荐权重
- 每日经营数据填报：客单价、就餐人数、天气
- AI API 接口预留

## 技术方案

### 一、数据层变更

#### 1.1 Store 实体新增字段

```typescript
// 门店设置扩展
targetTicketPriceBreakfast: number | null   // 目标早餐客单价（元）
targetTicketPriceLunch: number | null       // 目标正餐客单价（元）
pricePerLiang: number | null                // 原价（元/两）
memberPricePerLiang: number | null          // 会员价（元/两）— 暂仅记录
ricePrice: number | null                    // 米饭价格（元/位）— 暂仅记录
```

#### 1.2 新增表：daily_metrics（每日经营数据）

```sql
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storeId UUID NOT NULL REFERENCES store(id),
  date DATE NOT NULL,
  mealType VARCHAR NOT NULL,                 -- 'breakfast' | 'lunch'
  avgTicketPrice DECIMAL NOT NULL,           -- 实际客单价（元）
  customerCount INTEGER NOT NULL,            -- 就餐人数
  totalRevenue DECIMAL,                      -- 总营收（可选）
  weather VARCHAR,                           -- 天气（晴/阴/雨/雪/多云）
  recordedBy UUID REFERENCES "user"(id),
  createdAt TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(storeId, date, mealType)
);
```

#### 1.3 新增表：dish_feedback（菜品剩余/表现反馈）

```sql
CREATE TABLE dish_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storeId UUID NOT NULL REFERENCES store(id),
  date DATE NOT NULL,
  mealType VARCHAR NOT NULL,                 -- 'breakfast' | 'lunch'
  dishId UUID NOT NULL REFERENCES dish(id),
  leftoverLevel VARCHAR NOT NULL,            -- 'none' | 'low' | 'medium' | 'high'
  note TEXT,                                 -- 备注
  recordedBy UUID REFERENCES "user"(id),
  createdAt TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(storeId, date, mealType, dishId)
);
```

设计说明：
- 不统计所有菜品，只记录"剩余特别多"或"卖得很差"的突出菜品
- leftoverLevel 分四档：无剩余(none)、少量(low)、较多(medium)、大量(high)
- 填报人为店长（store_manager），通报到采购（buyer）和厨师长（chef_manager）

#### 1.4 新增表：menu_standards（菜单标准配置）

```sql
CREATE TABLE menu_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storeId UUID NOT NULL REFERENCES store(id),
  mealType VARCHAR NOT NULL,                 -- 'breakfast' | 'lunch'
  categoryName VARCHAR NOT NULL,             -- 分类名：蒸菜/炒菜/砂锅...
  requiredCount INTEGER NOT NULL DEFAULT 1,  -- 该分类最少菜品数
  UNIQUE(storeId, mealType, categoryName)
);
```

借鉴 v1 的 menu-standard 页面，按门店 + 餐段配置每个分类的菜品数量要求。

#### 1.5 新增表：default_dishes（每日默认/固定菜品）

```sql
CREATE TABLE default_dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storeId UUID NOT NULL REFERENCES store(id),
  mealType VARCHAR NOT NULL,                 -- 'breakfast' | 'lunch'
  dayOfWeek SMALLINT NOT NULL,               -- 1=周一, 7=周日
  dishId UUID NOT NULL REFERENCES dish(id),
  UNIQUE(storeId, mealType, dayOfWeek, dishId)
);
```

借鉴 v1 的每日默认菜品功能。这些菜品：
- 不受推荐分影响（白名单）
- 不影响推荐分计算（评分时排除）
- 按门店 + 餐段 + 星期几配置

#### 1.6 新增表：algorithm_config（算法配置参数）

```sql
CREATE TABLE algorithm_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storeId UUID NOT NULL REFERENCES store(id),
  configKey VARCHAR NOT NULL,
  configValue JSONB NOT NULL,
  UNIQUE(storeId, configKey)
);
```

借鉴 v1 的 algorithm-config，门店隔离的算法参数。默认配置：

```json
{
  "ticketPrice": {
    "deviationThreshold": 0.10,
    "lowTicketMeatBonus": 20,
    "lowTicketVegPenalty": 10,
    "highTicketHighMarginBonus": 15,
    "highTicketLowMarginPenalty": 15,
    "scaleCap": 3.0
  },
  "freshness": {
    "lookbackDays": 7,
    "freshnessBonus": 10,
    "freshnessPenalty": -8
  },
  "profit": {
    "highMarginBalance": 10,
    "mediumMarginBalance": 8,
    "trafficBalance": 5
  },
  "diversity": {
    "perAttributeBonus": 8,
    "diversityPenalty": -2
  },
  "category": {
    "lowThreshold": 2,
    "lowBonus": 5,
    "highThreshold": 5,
    "highPenalty": -3
  },
  "feedback": {
    "highLeftoverPenalty": -15,
    "mediumLeftoverPenalty": -8,
    "lowLeftoverBonus": 5
  },
  "output": {
    "recommendLimit": 20
  }
}
```

管理员可通过 web-admin 修改，仅 admin 可见。

#### 1.7 新增表：dish_type_tags（菜品分类标签组）

```sql
CREATE TABLE dish_type_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL UNIQUE,              -- 标签名：大荤/小荤/素菜
  rules JSONB NOT NULL,                      -- 匹配规则
  sortOrder INTEGER NOT NULL DEFAULT 0
);
```

默认标签组（可在 web-admin 中修改）：

```json
[
  { "name": "大荤", "rules": { "relatedIngredients": ["肉","禽","海鲜","虾蟹贝壳","牛肉"], "minMainIng": 1 } },
  { "name": "小荤", "rules": { "hasMix": true } },
  { "name": "素菜", "rules": { "relatedIngredients": { "exclude": ["肉","禽","海鲜","虾蟹贝壳","牛肉"] } } }
]
```

菜品填报时系统自动判定，也可手动修改。汤/水果/凉菜/茶饮不参与此分类。

#### 1.8 新增表：menu_pairing_rules（菜单搭配规则）

```sql
CREATE TABLE menu_pairing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storeId UUID NOT NULL REFERENCES store(id),
  mealType VARCHAR NOT NULL,                 -- 'breakfast' | 'lunch'
  tagName VARCHAR NOT NULL,                  -- 大荤/小荤/素菜
  minCount INTEGER NOT NULL DEFAULT 0,
  maxCount INTEGER,
  UNIQUE(storeId, mealType, tagName)
);
```

每家门店可配置不同的搭配规则（如：正餐至少 5 个大荤、8 个小荤、10 个素菜）。

#### 1.9 新增表：ai_suggestions（AI 建议记录）

```sql
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storeId UUID NOT NULL REFERENCES store(id),
  type VARCHAR NOT NULL,                     -- 'daily_briefing' | 'param_tuning' | 'menu_suggestion'
  content JSONB NOT NULL,                    -- 建议内容
  status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending' | 'applied' | 'dismissed'
  reviewedBy UUID REFERENCES "user"(id),
  createdAt TIMESTAMP NOT NULL DEFAULT now()
);
```

AI 接口预留表，Phase 2 接入 LLM 后使用。

### 二、算法层变更

#### 2.1 推荐算法增强（在 costing.service.ts 现有基础上扩展）

现有算法：
```
score = baseScore(毛利×100) + recommendBonus(权重×30) + inventoryBonus(库存) - frequencyPenalty(频率×5)
```

新增维度：
```
score = baseScore + recommendBonus + inventoryBonus - frequencyPenalty
      + ticketPriceBonus      // 客单价反馈加成
      + pairingBonus          // 搭配缺口加成
      + feedbackBonus         // 历史表现反馈加成
      + diversityBonus        // 食材多样性加成
      + categoryBonus         // 分类均衡加成
```

#### 2.2 ticketPriceBonus 计算逻辑

```
1. 查前一天同餐段的 daily_metrics
2. 计算偏差率 = (actualPrice - targetPrice) / targetPrice
3. 判断菜品类型：
   - 大荤/小荤/素菜 通过 dish_type_tags 判定
   - 高毛利/低毛利 通过 standardCost vs pricePerLiang 计算
4. 根据偏差方向和菜品类型计算加成
5. 按偏差程度缩放（cap 在 3 倍）
6. 阈值默认 ±10%，管理员可调
```

#### 2.3 pairingBonus 计算逻辑

```
1. 获取当前菜单计划中已有的菜品分类统计
2. 对比 menu_pairing_rules 中的最低要求
3. 缺口最大的分类，对应菜品获得加分
   如：大荤还缺 3 个 → 所有未入选的大荤菜品 +15 分
```

#### 2.4 feedbackBonus 计算逻辑

```
1. 查近 7 天该菜品的 dish_feedback 记录
2. 多次被标记为"剩余多" → 降低权重
3. 从未被标记或标记为"无剩余" → 小幅加分
```

#### 2.5 白名单排除

```
default_dishes 中的菜品：
- 不参与推荐排序（固定出现在菜单中）
- 菜单评分时排除这些菜品（不影响完整度评分）
- 推荐算法不计算这些菜品的分数
```

#### 2.6 菜单评分引擎（借鉴 v1 menu-scorer.js）

4 维度评分：
- **完整度（30 分）**：各分类菜品数是否达到 menu_standards 要求
- **多样性（30 分）**：食材属性覆盖度，避免单一属性重复过多
- **新鲜度（20 分）**：近 N 天未出现的菜品占比
- **毛利结构（20 分）**：高/中/引流款菜品比例是否合理

所有参数从 algorithm_config 读取，门店隔离。

### 三、接口层

#### 3.1 新增 API

```
# 每日经营数据
GET    /api/daily-metrics?storeId=&date=&mealType=    查询
POST   /api/daily-metrics                             填报
PUT    /api/daily-metrics/:id                         修改
GET    /api/daily-metrics/latest?storeId=&mealType=   获取最近一条

# 菜品反馈
GET    /api/dish-feedback?storeId=&date=&mealType=    查询
POST   /api/dish-feedback                             填报
PUT    /api/dish-feedback/:id                         修改

# 菜单标准配置
GET    /api/menu-standards?storeId=&mealType=         查询
PUT    /api/menu-standards                             批量更新

# 每日默认菜品
GET    /api/default-dishes?storeId=&mealType=&dayOfWeek=  查询
PUT    /api/default-dishes                            批量更新

# 算法配置
GET    /api/algorithm-config?storeId=                 查询
PUT    /api/algorithm-config                          更新（仅 admin）

# 菜品分类标签
GET    /api/dish-type-tags                            查询所有标签
POST   /api/dish-type-tags                            新增（仅 admin）
PUT    /api/dish-type-tags/:id                        修改（仅 admin）
DELETE /api/dish-type-tags/:id                        删除（仅 admin）

# 菜单搭配规则
GET    /api/menu-pairing-rules?storeId=&mealType=     查询
PUT    /api/menu-pairing-rules                        批量更新

# 菜单评分
POST   /api/menu-score                                对菜单进行评分
GET    /api/menu-score/history?storeId=&startDate=&endDate=  历史评分

# AI 接口预留
GET    /api/ai/daily-briefing?storeId=&date=          每日简报
POST   /api/ai/suggestions/:id/apply                  应用建议
GET    /api/ai/suggestions?storeId=                   查询建议列表
```

#### 3.2 修改现有 API

```
GET /api/stores/:id        → 返回新增字段
PATCH /api/stores/:id      → 可更新新增字段

GET /api/costing/recommendations
  → 算法增强，返回新增维度信息
  → reasons 数组增加原因说明
  → 排除白名单菜品

GET /api/dishes /api/dishes/:id
  → 返回新增 dishTypeTag 字段（大荤/小荤/素菜）
```

### 四、前端层

#### 4.1 小程序（miniapp）

| 页面 | 改动 |
|------|------|
| 首页（index） | 未填报提醒：显示"请填报昨日经营数据"卡片（店长/admin），点击跳转填报页 |
| 新增：每日填报（daily-report） | 填报客单价、就餐人数、天气（早餐/正餐两个 tab），菜品剩余反馈 |
| 门店管理（store-manage） | 增加目标客单价、称重单价、米饭价格字段（仅展示，修改在 web-admin） |
| 分析页（analysis） | 推荐结果展示增加客单价反馈原因，菜单评分展示 |
| 菜单规划（menu-plan） | 集成菜单评分，显示搭配缺口提示 |

#### 4.2 Web Admin

| 页面 | 改动 |
|------|------|
| 门店（stores） | 编辑表单增加目标客单价、称重单价、米饭价格 |
| 新增：每日经营数据 | 表格展示所有门店填报数据，支持筛选、导出 |
| 新增：菜品反馈 | 表格展示菜品剩余反馈记录 |
| 新增：菜单标准配置 | 按门店+餐段配置各分类菜品数量要求 |
| 新增：每日默认菜品 | 按门店+餐段+星期几配置固定菜品白名单 |
| 新增：算法参数配置 | 可视化编辑所有算法参数，仅 admin 可见 |
| 新增：菜品分类标签 | 管理大荤/小荤/素菜标签和匹配规则 |
| 新增：搭配规则 | 按门店+餐段配置大荤/小荤/素菜数量要求 |
| 菜品（ingredients） | 增加大荤/小荤/素菜分类显示 |
| 菜品（dishes） | 增加大荤/小荤/素菜分类，支持手动修改 |

### 五、数据库迁移

新增迁移文件：`20260413000000-add-recommendation-system.ts`

包含所有新增表的 CREATE TABLE 和 Store 表的 ALTER TABLE。

### 六、数据流总览

```
店长每日填报
├── 每日经营数据（客单价、人数、天气）
├── 菜品剩余反馈（突出菜品）
│
▼
系统自动处理
├── 客单价偏差分析 → ticketPriceBonus
├── 菜品表现统计 → feedbackBonus
├── 菜单搭配检查 → pairingBonus
│
▼
厨师长使用
├── 菜单规划页：看到推荐排序（含加成原因）
├── 菜单评分：对已选菜单进行 4 维度评分
├── 搭配缺口提示："大荤还缺 2 道"
│
▼
管理员调整
├── 算法参数配置（web-admin）
├── 菜单标准配置（各分类数量）
├── 固定菜品白名单（排除推荐影响）
├── 菜品分类标签规则
```

## Phase 2（后续）

- 微信模板消息推送提醒
- 天气 API 自动获取（推荐：和风天气 QWeather）
- AI 接入（LLM 每日简报 + 参数调优建议）
- 食材损耗填报
- 采购价格趋势分析

## 风险点

1. **食材价格为 0**：273 个食材价格全部为 0，毛利计算依赖价格数据，需先录入
2. **菜品成本计算**：称重模式下售价统一，成本需要根据食材用量×单价实时计算
3. **搭配规则复杂度**：v1 已有成熟的 4 维度评分，迁移时需适配 v2 数据结构
4. **性能**：推荐算法增加多个维度计算，需确保响应时间 < 500ms
5. **天气 API**：和风天气免费版每天 1000 次，足够使用
