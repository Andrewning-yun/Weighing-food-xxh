# 餐饮供应链小程序 - UI设计规范文档

> 项目：catering-supply-chain  
> AppID：wx6895581b02d2bed4  
> 生成日期：2026-04-15

---

## 目录

1. [全局设计规范](#一全局设计规范)
2. [页面路由与功能说明](#二页面路由与功能说明)
3. [每个页面的UI结构](#三每个页面的ui结构)
4. [组件拆分意见](#四组件拆分意见)
5. [Claude Code 生成指令](#五claude-code-生成指令)

---

## 一、全局设计规范

### 1.1 设计系统概述

本项目采用**双主题设计系统**：

| 主题 | 文件 | 主色 | 适用场景 |
|------|------|------|----------|
| **品牌主题** | `styles/brand-theme.wxss` | #E8530E (辣椒橙) | 小湘惠·家味厨房，温暖有食欲的湘菜风格 |
| **白模主题** | `styles/white-theme.wxss` | #4A7BF7 (中性蓝) | 通用模板，简洁现代，适合任何行业复用 |

**切换方式**：修改 `app.wxss` 中的 `@import` 语句，并同步修改 `app.json` 中的 `navigationBarBackgroundColor` 和 `tabBar.selectedColor`。

### 1.2 色彩系统（CSS变量）

```css
/* 主色系 */
--primary: #E8530E;           /* 品牌主色 */
--primary-hover: #D14A0C;     /* 悬停态 */
--primary-light: #FFF0E8;     /* 浅色背景 */
--primary-lighter: #FFF7F3;   /* 更浅背景 */
--primary-bg: rgba(232, 83, 14, 0.06); /* 微背景 */

/* 功能色 */
--success: #2BA471;           /* 成功/新鲜绿 */
--success-light: #E8F8F1;
--warning: #F5A623;           /* 提醒/金黄 */
--warning-light: #FFF5E5;
--danger: #E53935;            /* 危险/警告红 */
--danger-light: #FFEDED;
--info: #2E86DE;              /* 信息/天蓝 */
--info-light: #E8F2FC;

/* 文字色 */
--text-primary: #2D2D2D;      /* 主文字 */
--text-secondary: #6B6B6B;    /* 次要文字 */
--text-placeholder: #BFBFBF;  /* 占位符 */
--text-disabled: #999999;     /* 禁用态 */
--text-inverse: #FFFFFF;      /* 反色文字 */

/* 背景色 */
--bg-page: #F6F3EF;           /* 页面背景（温暖米白） */
--bg-card: #FFFFFF;           /* 卡片背景 */
--bg-hover: #F9F7F5;          /* 悬停背景 */
--bg-input: #FAF8F6;          /* 输入框背景 */

/* 边框色 */
--border: #E8E3DD;
--border-light: #F0ECE7;
--border-dark: #D4CFC8;

/* 阴影 */
--shadow-sm: 0 2rpx 8rpx rgba(139, 94, 60, 0.06);
--shadow-md: 0 4rpx 20rpx rgba(139, 94, 60, 0.08);
--shadow-lg: 0 8rpx 32rpx rgba(139, 94, 60, 0.12);
--shadow-card: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
```

### 1.3 间距系统

```css
--space-xs: 8rpx;
--space-sm: 16rpx;
--space-md: 24rpx;
--space-lg: 32rpx;
--space-xl: 48rpx;
--space-xxl: 64rpx;
```

### 1.4 圆角系统

```css
--radius-xs: 6rpx;    /* 小标签 */
--radius-sm: 10rpx;   /* 按钮 */
--radius-md: 16rpx;   /* 卡片 */
--radius-lg: 24rpx;   /* 大卡片 */
--radius-xl: 32rpx;   /* 特殊 */
--radius-full: 999rpx; /* 胶囊/圆形 */
```

### 1.5 字体系统

```css
--font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif;

--font-xs: 22rpx;     /* 辅助文字 */
--font-sm: 24rpx;     /* 次要文字 */
--font-base: 28rpx;   /* 正文 */
--font-md: 30rpx;     /* 小标题 */
--font-lg: 32rpx;     /* 卡片标题 */
--font-xl: 36rpx;     /* 页面标题 */
--font-2xl: 44rpx;    /* 大数字 */
--font-3xl: 56rpx;    /* 超大标题 */
```

### 1.6 通用组件样式

#### 卡片 `.card`
```css
.card {
  background: var(--bg-card);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}
```

#### 按钮 `.btn`
```css
/* 主按钮 */
.btn-primary {
  background: var(--primary);
  color: #ffffff;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

/* 品牌按钮（渐变） */
.btn-brand {
  background: linear-gradient(135deg, #E8530E, #F06A2F);
  color: #FFFFFF;
  border-radius: var(--radius-full);
  font-weight: 600;
  box-shadow: 0 6rpx 20rpx rgba(232, 83, 14, 0.3);
}

/* 幽灵按钮 */
.btn-brand-ghost {
  background: var(--primary-light);
  color: var(--primary);
  border-radius: var(--radius-md);
}
```

#### 标签 `.tag`
```css
.tag {
  display: inline-block;
  padding: 8rpx 16rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
}
.tag-primary { background: var(--primary-light); color: var(--primary); }
.tag-success { background: var(--success-light); color: var(--success); }
.tag-warning { background: var(--warning-light); color: var(--warning); }
.tag-danger { background: var(--danger-light); color: var(--danger); }
```

#### 状态徽章 `.status-badge`
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}
.status-badge.pending { background: var(--warning-light); color: var(--warning); }
.status-badge.approved { background: var(--success-light); color: var(--success); }
.status-badge.rejected { background: var(--danger-light); color: var(--danger); }
.status-badge.completed { background: var(--primary-light); color: var(--primary); }
```

### 1.7 布局规范

#### 页面容器
```css
.container {
  padding: 24rpx;
  min-height: 100vh;
  background: var(--bg-page);
}
```

#### 吸顶区域
```css
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-page);
}
```

#### Flex工具类
```css
.flex { display: flex; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-column { display: flex; flex-direction: column; }
```

### 1.8 TabBar配置

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#E8530E",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "assets/icons/home.png", "selectedIconPath": "assets/icons/home-active.png" },
      { "pagePath": "pages/ingredients/ingredients", "text": "食材库", "iconPath": "assets/icons/ingredient.png", "selectedIconPath": "assets/icons/ingredient-active.png" },
      { "pagePath": "pages/menu/menu", "text": "菜单中心", "iconPath": "assets/icons/menu.png", "selectedIconPath": "assets/icons/menu-active.png" },
      { "pagePath": "pages/task/task", "text": "任务", "iconPath": "assets/icons/task.png", "selectedIconPath": "assets/icons/task-active.png" },
      { "pagePath": "pages/profile/profile", "text": "个人中心", "iconPath": "assets/icons/profile.png", "selectedIconPath": "assets/icons/profile-active.png" }
    ]
  }
}
```

---

## 二、页面路由与功能说明

### 2.1 页面清单（17个页面）

| 序号 | 页面路径 | 页面名称 | 主要功能 | 数据存储 |
|------|----------|----------|----------|----------|
| 1 | `pages/login/login` | 登录页 | 微信登录、账号密码登录、授权码绑定 | 全局共享 |
| 2 | `pages/index/index` | 首页 | 用户信息、门店切换、快速操作、今日概览、菜单预览 | 门店隔离 |
| 3 | `pages/menu/menu` | 菜单中心 | 日期选择、菜品搜索添加、分类展示、数量调整、原材料汇总、智能推荐 | 门店隔离 |
| 4 | `pages/task/task` | 任务页 | 补货任务列表、完成状态切换、手动添加任务 | 门店隔离 |
| 5 | `pages/audit/audit` | 审核管理 | 采购审核、菜品审核、审批操作 | 门店隔离 |
| 6 | `pages/profile/profile` | 个人中心 | 用户信息、权限说明、快捷入口、退出登录 | 全局共享 |
| 7 | `pages/ingredients/ingredients` | 食材库 | 食材列表、品类筛选、品类/单位管理 | 全局共享 |
| 8 | `pages/dish-library/dish-library` | 菜品库 | 菜品列表、分类筛选、毛利筛选、新增/编辑菜品 | 全局共享 |
| 9 | `pages/dish-edit/dish-edit` | 菜品编辑 | 菜品信息编辑、BOM配方设置 | 全局共享 |
| 10 | `pages/analysis/analysis` | 菜单分析 | 日期范围选择、毛利分布、分类分布、排行榜 | 门店隔离 |
| 11 | `pages/store-manage/store-manage` | 门店管理 | 门店列表、新增门店 | 全局共享 |
| 12 | `pages/store-detail/store-detail` | 门店详情 | 门店信息编辑、删除 | 全局共享 |
| 13 | `pages/algorithm-config/algorithm-config` | 推荐参数 | 智能推荐算法权重设置 | 门店隔离 |
| 14 | `pages/menu-standard/menu-standard` | 菜单标准 | 各分类菜品标准数量配置 | 门店隔离 |
| 15 | `pages/staff-manage/staff-manage` | 员工管理 | 员工列表、新增/编辑员工、授权码生成 | 全局共享 |
| 16 | `pages/data-init/data-init` | 数据初始化 | 一键初始化默认数据（仅开发） | INIT-ONLY |
| 17 | `pages/data-import/data-import` | 数据导入 | Excel/CSV批量导入食材库或菜品库 | 全局共享 |

### 2.2 角色权限矩阵

| 功能 | admin(管理员) | chef_head(厨师长) | chef(厨师) | buyer(采购) |
|------|---------------|-------------------|------------|-------------|
| 门店切换 | ✅ 所有门店 | ❌ 仅分配门店 | ❌ 仅分配门店 | ✅ 分配门店 |
| 菜单管理 | ✅ | ✅ | ✅ | ❌ |
| 任务管理 | ✅ | ✅ | ✅ | ❌ |
| 审核管理 | ✅ | ❌ | ❌ | ✅ 仅采购 |
| 菜品库 | ✅ 编辑 | ✅ 编辑 | ✅ 查看 | ✅ 查看 |
| 食材库 | ✅ 编辑 | ✅ 查看 | ✅ 查看 | ✅ 编辑 |
| 员工管理 | ✅ | ❌ | ❌ | ❌ |
| 门店管理 | ✅ | ❌ | ❌ | ❌ |
| 数据导入 | ✅ | ❌ | ❌ | ❌ |
| 推荐参数 | ✅ | ❌ | ❌ | ❌ |

### 2.3 数据存储规范

| 数据类型 | Storage Key | 隔离方式 |
|----------|-------------|----------|
| 菜品库 | `dish_library_v2` | 全局共享 |
| 食材库 | `ingredients_lib` | 全局共享 |
| 食材分类 | `ingredients_categories` | 全局共享 |
| 食材单位 | `ingredients_units` | 全局共享 |
| 员工列表 | `staff_list` | 全局共享 |
| 菜单数据 | `menu_YYYYMMDD_storeId` | 门店隔离 |
| 任务数据 | `tasks_YYYYMMDD_storeId` | 门店隔离 |
| 审核记录 | `audits_storeId` | 门店隔离 |
| 用户信息 | `userInfo` | 全局共享 |
| 用户角色 | `userRole` | 全局共享 |
| 当前门店 | `current_store_id` | 全局共享 |

---

## 三、每个页面的UI结构

### 3.1 登录页 (login)

**结构层级：**
```
login-page (渐变背景)
├── login-header (品牌区域)
│   ├── brand-icon (🍳)
│   ├── brand-title (餐饮供应链)
│   └── brand-desc (门店补货辅助管理系统)
├── login-tabs (登录方式切换)
│   ├── tab-item (微信登录)
│   ├── tab-item (账号登录)
│   └── tab-item (授权码绑定)
├── login-body (登录内容区)
│   ├── 微信登录: wechat-login-section
│   ├── 账号登录: form-group × 2 (账号/密码)
│   └── 授权码绑定: bindcode-section (6位码输入)
└── login-footer (底部提示)
```

**关键交互：**
- 登录方式 Tab 切换
- 密码显示/隐藏切换
- 6位授权码输入框（模拟格子输入）

---

### 3.2 首页 (index)

**结构层级：**
```
container
├── user-card (用户信息卡片)
│   ├── user-info
│   │   ├── avatar
│   │   └── info (name + role-title)
│   └── store-switch-wrap (门店切换下拉)
├── quick-actions (快速操作)
│   └── action-item × 5 (今日菜单/菜品库/待办任务/待审核/菜单分析)
├── stats-card (今日概览统计)
│   └── stats-row (今日菜品/待办任务/待审核)
└── card (今日菜单预览)
    └── category-section × N (按分类显示菜品)
```

**关键交互：**
- 门店切换下拉浮窗
- 快速操作跳转
- 统计数字点击跳转

---

### 3.3 菜单中心 (menu)

**结构层级：**
```
container
├── sticky-header (吸顶区域)
│   ├── date-header (日期选择 + 状态徽章)
│   └── add-section (搜索添加区)
│       ├── search-wrap (搜索框 + 推荐下拉)
│       ├── add-btn (添加按钮)
│       └── recommend-ai-btn (🤖 推荐)
├── saved-score-panel (历史评分详情，可展开)
├── dish-summary (已添加菜品统计)
├── category-section × N (按分类显示菜品列表)
│   ├── category-header (分类标题 + 数量)
│   └── dish-list
│       └── dish-item (菜品行)
│           ├── dish-row-left (菜名 + BOM警告)
│           └── dish-row-right (数量控件/配方按钮/删除)
├── section (原材料汇总)
│   └── summary-list (食材清单)
├── action-bar (底部操作栏)
│   ├── btn-outline (导出清单)
│   └── btn-primary (发布/提交审核)
└── bottom-modal (智能推荐弹窗)
    ├── recommend-header (标题 + 换一批)
    ├── recommend-filter-row × 2 (策略/分类选择)
    └── recommend-list (推荐菜品卡片)
```

**关键交互：**
- 日期选择器
- 搜索实时推荐
- 数量加减控件
- 智能推荐弹窗
- 评分浮窗 (score-fab组件)

---

### 3.4 食材库 (ingredients)

**结构层级：**
```
container
├── sticky-header (吸顶区域)
│   ├── search-bar (搜索栏)
│   └── filter-bar (品类筛选)
├── list (食材列表)
│   ├── list-header (统计 + 新增按钮)
│   └── ingredient-card × N
│       ├── ing-info (名称 + 别名 + 品类/单位标签)
│       └── ing-actions (编辑/删除)
└── config-bar (配置区 - 仅可编辑角色)
    ├── config-section (品类管理 + 排序编辑)
    └── config-section (计量单位)

// 弹窗
├── sort-modal (品类排序弹窗)
├── bottom-modal (新增/编辑食材)
└── bottom-modal (添加品类/单位)
```

**关键交互：**
- 品类筛选
- 品类排序编辑
- 品类/单位增删改

---

### 3.5 菜品库 (dish-library)

**结构层级：**
```
container
├── search-bar (搜索栏)
├── filter-bar (菜品分类筛选 - tag模式)
├── filter-bar (毛利等级筛选 - button模式)
└── dish-list-area (菜品列表)
    ├── list-header (统计 + 新增按钮)
    └── dish-card × N
        ├── dish-header (名称/分类/毛利标签/食材数)
        ├── dish-subtitle (食材属性标签)
        ├── bom-preview (BOM预览 - 主料/辅料)
        └── dish-actions (编辑/删除)

// 弹窗
└── bottom-modal (新增/编辑菜品)
    ├── form-row (菜品名称)
    ├── similar-dish-tip (相似菜品提示)
    ├── form-row (所属品类)
    ├── form-row (毛利润等级)
    ├── bom-section-header + bom-list (主料区)
    └── bom-section-header + bom-list (辅料区)

// 子组件
└── ingredient-picker (食材选择弹窗)
```

**关键交互：**
- 双维度筛选（分类 + 毛利）
- 相似菜品检测提示
- 主料/辅料分别管理
- 食材选择器

---

### 3.6 任务页 (task)

**结构层级：**
```
container
├── sticky-header (吸顶区域)
│   ├── top-bar (日期选择 + 编辑按钮)
│   ├── filter-bar (筛选: 全部/待完成/已完成)
│   └── stats-bar (统计: 总任务/待完成/已完成)
├── task-list (任务列表)
│   └── task-row × N
│       ├── task-info (任务名 + 数量)
│       └── task-check (复选框/删除按钮)
├── empty-state (空状态)
└── fab (悬浮新增按钮)

// 弹窗
├── bottom-modal (手动添加补货)
├── bottom-modal (修改用量)
└── ingredient-picker (食材选择)
```

**关键交互：**
- 编辑模式切换
- 任务完成状态切换
- 数量编辑
- 手动添加任务

---

### 3.7 审核管理 (audit)

**结构层级：**
```
container
├── tab-bar (采购审核/菜品审核)
├── pending-dishes-reminder (待审批提醒横幅)
├── audit-filter-wrap (状态筛选)
├── stats-bar (统计)
└── audit-list (审核列表)
    └── audit-card × N
        ├── audit-card-header (类型/状态/收起箭头)
        ├── collapsed状态: 标题 + 统计
        └── expanded状态:
            ├── detail-tab-bar (采购明细/菜单明细)
            ├── purchase-detail/menu-detail
            ├── audit-meta (创建人/时间)
            ├── audit-actions (批复/拒绝按钮)
            └── audit-review-info (审批时间/原因)
```

**关键交互：**
- Tab切换
- 卡片收起/展开
- 明细Tab切换
- 审批操作

---

### 3.8 个人中心 (profile)

**结构层级：**
```
container
├── profile-header (用户信息头部 - 渐变背景)
│   ├── avatar-wrap (头像 + 编辑角标)
│   └── user-info (姓名/角色标签/门店)
├── overview-card (数据概览)
│   └── overview-row (菜品总数/待办任务)
├── perm-card (权限说明)
│   ├── perm-header (标题 + 角色标签)
│   └── perm-list (权限列表)
├── menu-card (系统管理 - 仅admin)
│   └── shortcut-item × 3 (门店/员工/数据导入)
├── menu-card (门店管理 - 仅buyer)
├── menu-card (快捷入口)
│   └── shortcut-item × N
└── logout-section (退出登录)
```

---

### 3.9 菜单分析 (analysis)

**结构层级：**
```
container
├── header-card sticky-header (吸顶头部)
│   ├── header-row (页面标题)
│   ├── date-range-wrap (日期范围选择)
│   └── custom-date-row (自定义日期)
├── tab-bar (overview/ingredients/dishes/profit)
├── stats-row (核心统计数字)
└── 根据tab显示不同内容:
    ├── overview: 毛利分布 + 分类分布
    ├── ingredients: 食材用量排行TOP
    ├── dishes: 菜品使用频率排行TOP
    └── profit: 毛利占比堆叠条 + 优化建议
```

---

## 四、组件拆分意见

### 4.1 现有组件（8个）

| 组件名 | 路径 | 功能 | Props |
|--------|------|------|-------|
| bottom-modal | `/components/bottom-modal/` | 底部/居中弹窗容器 | show, title, maxHeight, position, showCancel, cancelText, confirmText, showFooter, maskClosable |
| filter-bar | `/components/filter-bar/` | 筛选栏 | items, activeValue, type(tag/button), scrollable |
| search-bar | `/components/search-bar/` | 搜索栏 | placeholder, value, showAction, actionText |
| empty-state | `/components/empty-state/` | 空状态 | icon, text, hint |
| form-row | `/components/form-row/` | 表单项 | label, type(input/picker/textarea), placeholder, value, range, rangeKey |
| ingredient-picker | `/components/ingredient-picker/` | 食材选择器 | show, title, ingredients, filterType, groupType |
| action-bar | `/components/action-bar/` | 底部操作栏 | slot |
| score-fab | `/components/score-fab/` | 评分浮窗 | dishes, date, status, defaultDishIds, panelTitle |

### 4.2 建议新增原子组件

基于代码分析，建议从现有页面中提取以下可复用组件：

#### 1. `stat-card` 统计卡片
```
Props: value, label, color?, clickable?
用途: 首页、分析页、审核页的统计展示
```

#### 2. `dish-card` 菜品卡片
```
Props: dish, showBom?, showActions?, onEdit, onDelete
用途: 菜品库、菜单中心、审核页
```

#### 3. `category-header` 分类标题
```
Props: title, count, color
用途: 首页、菜单中心的分类区块
```

#### 4. `list-item` 列表项
```
Props: title, subtitle, tags[], actions[], onClick
用途: 任务列表、审核列表、快捷入口
```

#### 5. `qty-stepper` 数量步进器
```
Props: value, min, max, onChange
用途: 菜单中心、任务编辑
```

#### 6. `tag-list` 标签列表
```
Props: tags[], activeTag, onChange, scrollable?
用途: 筛选栏的替代，更灵活
```

#### 7. `section-header` 区块标题
```
Props: title, action?, actionText?
用途: 各页面的区块标题统一
```

### 4.3 组件优化建议

1. **bottom-modal**: 考虑支持多层级弹窗（弹窗上再弹窗）
2. **filter-bar**: 增加 `type='dropdown'` 支持下拉筛选
3. **form-row**: 增加 `type='switch'` 支持开关
4. **ingredient-picker**: 考虑虚拟滚动优化大数据量性能

---

## 五、Claude Code 生成指令

### 5.1 通用提示词模板

```
你是一个专业的小程序开发工程师，使用微信小程序原生技术栈开发。

技术约束：
- 使用 WXML + WXSS + JS (ES6)
- 样式使用 rpx 单位
- 颜色使用 CSS 变量（参考 brand-theme.wxss）
- 组件引用使用 usingComponents 配置
- 数据存储使用 utils/store.js

代码规范：
- 使用语义化类名
- 避免使用 !important
- 按钮需要处理 ::after 边框
- 输入框需要设置 box-sizing: border-box
- 图片使用 mode="aspectFill" 或 "aspectFit"
```

### 5.2 页面生成指令

#### 生成首页
```
请生成餐饮供应链小程序的首页 (pages/index/index)，包含：

1. 用户信息卡片：
   - 左侧：头像 + 用户名 + 角色标签
   - 右侧：门店切换下拉（仅admin/buyer显示）

2. 快速操作区（5个入口）：
   - 今日菜单、菜品库、待办任务、待审核、菜单分析
   - 使用图标 + 文字，带角标提示

3. 今日概览统计：
   - 今日菜品数、待办任务数、待审核数

4. 今日菜单预览：
   - 按分类显示（蒸菜/炒菜/煎扒等）
   - 每个分类显示菜品列表

数据需求：
- 从 store.js 获取 userInfo, userRole, currentStore
- 从 store.js 获取今日菜单数据
- 计算各分类菜品数量

样式要求：
- 使用 .container { padding: 24rpx; }
- 卡片使用 .card 类
- 主色 #E8530E
```

#### 生成菜单中心
```
请生成餐饮供应链小程序的菜单中心页 (pages/menu/menu)，包含：

1. 吸顶头部：
   - 日期选择器（picker mode="date"）
   - 状态徽章（草稿/已发布/已审核）
   - 搜索框（实时推荐）+ 添加按钮 + 智能推荐按钮

2. 菜品列表（按分类）：
   - 分类标题（带颜色圆点）
   - 菜品行：名称 + BOM警告 + 数量步进器 + 配方按钮 + 删除

3. 原材料汇总区：
   - 根据菜品BOM自动计算
   - 可手动调整数量

4. 底部操作栏：
   - 导出清单按钮
   - 发布菜单/提交审核按钮

5. 智能推荐弹窗：
   - 推荐策略选择
   - 菜品分类筛选
   - 推荐菜品列表（带原因标签）

组件使用：
- <filter-bar> 用于分类筛选
- <bottom-modal> 用于推荐弹窗
- <score-fab> 用于评分浮窗

数据需求：
- dish_library_v2（菜品库）
- menu_YYYYMMDD_storeId（菜单数据）
- ingredients_lib（食材库）
```

#### 生成菜品库
```
请生成餐饮供应链小程序的菜品库页 (pages/dish-library/dish-library)，包含：

1. 搜索栏 + 双维度筛选：
   - 菜品分类筛选（tag模式，横向滚动）
   - 毛利等级筛选（button模式：全部/高毛利/中毛利/引流款/未设置）

2. 菜品列表：
   - 卡片式布局
   - 头部：菜名 + 分类标签 + 毛利标签
   - BOM预览：主料/辅料分别显示
   - 操作按钮：编辑/删除

3. 新增/编辑弹窗：
   - 菜品名称输入
   - 相似菜品检测提示
   - 品类选择器
   - 毛利等级选择器
   - 主料区（可添加/删除/设置用量）
   - 辅料区（同上）

组件使用：
- <search-bar> 搜索
- <filter-bar> × 2 筛选
- <bottom-modal> 弹窗
- <form-row> 表单项
- <ingredient-picker> 食材选择
- <empty-state> 空状态
```

#### 生成任务页
```
请生成餐饮供应链小程序的任务页 (pages/task/task)，包含：

1. 吸顶区域：
   - 日期选择器 + 编辑按钮
   - 状态筛选（全部/待完成/已完成）
   - 统计栏（总任务/待完成/已完成）

2. 任务列表：
   - 紧凑单行布局
   - 任务名 + 数量
   - 复选框（完成状态）
   - 编辑模式显示删除按钮

3. 悬浮新增按钮（FAB）

4. 新增/编辑弹窗：
   - 食材选择（点击打开食材库）
   - 数量输入
   - 单位选择器

组件使用：
- <filter-bar> 状态筛选
- <bottom-modal> 弹窗
- <ingredient-picker> 食材选择
```

### 5.3 组件生成指令

#### 生成统计卡片组件
```
请生成一个统计卡片组件 components/stat-card/stat-card，包含：

Props:
- value: String/Number - 数值
- label: String - 标签
- color: String - 数值颜色（可选，默认主色）
- clickable: Boolean - 是否可点击

Events:
- tap - 点击事件

样式：
- 圆角 16rpx
- 白色背景
- 阴影
- 数值 44rpx 加粗
- 标签 22rpx 灰色
```

#### 生成数量步进器组件
```
请生成一个数量步进器组件 components/qty-stepper/qty-stepper，包含：

Props:
- value: Number - 当前值
- min: Number - 最小值（默认0）
- max: Number - 最大值（默认999）
- step: Number - 步长（默认1）

Events:
- change - 值变化事件

样式：
- 横向布局：减号按钮 + 输入框 + 加号按钮
- 边框圆角 10rpx
- 按钮背景 #f5f5f5
- 输入框居中
```

---

## 附录：分类与颜色映射

### 菜品分类（9类）

| 分类 | 颜色 |
|------|------|
| 蒸菜 | #52c41a |
| 煎扒 | #fa8c16 |
| 油炸 | #fadb14 |
| 砂锅 | #eb2f96 |
| 炒菜 | #f5222d |
| 水果 | #13c2c2 |
| 凉菜 | #1890ff |
| 例汤 | #722ed1 |
| 茶饮 | #2f54eb |

### 毛利等级

| 等级 | 颜色 | 说明 |
|------|------|------|
| high | #f5222d | 高毛利 |
| medium | #fa8c16 | 中毛利 |
| traffic | #1890ff | 引流款 |
| unset | #d9d9d9 | 未设置 |

---

*文档结束*
