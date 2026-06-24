# 多端验收简报

发布日期：2026-04-08

## 当前状态

当前仓库已经达到“可进入多端联合验收”的状态。

已经确认通过：

- 根工程 `build / lint / test`
- `services/api` 默认开发环境启动与 seed
- `services/api` 在 PostgreSQL 环境执行 migration
- `services/api` 在 PostgreSQL 环境完成登录、当前用户、菜品接口联调
- `apps/web-admin` 真实 Vite 运行
- `apps/web-admin` Chromium 冒烟
- `apps/web-admin` 菜品编辑页支持配方与 SOP 编辑
- `apps/miniapp` 真实 Taro weapp 构建链
- `apps/miniapp` 登录、菜单页、详情页、SOP 页面代码完成

当前仍依赖外部运行环境确认：

- 微信开发者工具中的 miniapp 真机态或模拟器态冒烟
- 多端人工回归

## 自动化验收结果

已验证命令：

```bash
npm run build
npm run lint
npm run test
npm run smoke:web-admin
```

`smoke:web-admin` 当前覆盖：

- 登录
- 页面切换：Ingredients / Users / Stores / Dishes
- 菜品创建
- 菜品删除

产物位置：

- `output/playwright/web-admin-smoke.png`
- `output/playwright/web-admin-smoke.json`

## 建议的验收顺序

1. 先验后端与数据库
2. 再验 web-admin 的关键维护路径
3. 最后验 miniapp 的厨房查看路径

## 多端人工回归重点

### 后端

- 使用 PostgreSQL 配置启动 API
- 验证 `auth / ingredients / dishes / users / stores`
- 确认 migration 可重复执行且不会误改已有表

### Web Admin

- 登录成功
- 原料新增、编辑、删除
- 菜品新增、编辑、删除
- 菜品配方行增删改
- 菜品 SOP 步骤增删改
- 用户新增、编辑、删除
- 门店新增、编辑、删除

### Miniapp

- 登录成功
- 菜单页正常拉取数据
- 搜索和浏览菜品
- 进入菜品详情
- SOP 步骤展示
- 退出会话并返回登录页

## 当前风险

- miniapp 还没有微信开发者工具里的最终运行时验收
- web-admin 目前的自动化冒烟覆盖的是主干流程，不是完整回归
- PostgreSQL 当前使用的是已有数据库模型，若目标环境权限更严格，需要再确认 DBA 策略

## 建议的验收结论口径

如果 web-admin 人工回归通过，且 miniapp 在微信开发者工具中完成真实冒烟，则当前项目可以定义为：

“达到 MVP 多端联调与基本交付水准，可进入试运行或内部验收阶段。”
