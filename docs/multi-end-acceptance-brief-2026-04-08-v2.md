# 多端验收简报

发布日期：2026-04-08

## 当前状态

项目已经完成以下关键闭环：
- 根工程 `build / lint / test` 可执行
- `services/api` 支持 PostgreSQL 迁移、seed 与核心接口联调
- `apps/web-admin` 可进行登录、原料、菜品、用户、门店管理
- `apps/miniapp` 已具备 Taro weapp 构建链和基础厨师端页面
- `scripts/smoke-web-admin.mjs` 已可自动验证 web-admin 主链路

## 本轮验收范围

- API：登录、当前用户、原料、菜品、用户、门店
- Web Admin：登录、原料新增/编辑/删除、菜品新增/编辑/删除、配方/SOP 编辑
- Miniapp：登录、菜单页、详情页、我的页、退出登录
- 数据库：PostgreSQL 迁移和核心接口联调

## 自动化产物

- `output/playwright/web-admin-smoke.png`
- `output/playwright/web-admin-smoke.json`

## 结论口径

当以下条件全部满足时，可认为当前版本达到多端验收门槛：
- 根级构建与测试通过
- PostgreSQL 环境下 API 可稳定访问
- Web Admin 自动化冒烟通过
- Miniapp 在微信开发者工具中完成真实运行时验收
- 验收记录和问题单已归档

## 验收建议

1. 先验后端和数据库
2. 再验 Web Admin
3. 最后验 Miniapp
4. 验收结果统一写入测试执行记录模板
