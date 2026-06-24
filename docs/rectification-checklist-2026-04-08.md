# 项目整改清单（执行中）

发布日期：2026-04-08
最后更新：2026-04-08

## 当前阶段结论

当前项目已经从“几乎无法构建”的状态推进到“全仓可 build / lint / test，后端可在默认开发环境和 PostgreSQL 环境下启动，web-admin 可运行，miniapp 已接入真实 Taro weapp 构建链”的状态。

当前已完成：

- 根目录改为 `npm workspaces`
- 根目录 `build / lint / test` 可执行
- `services/api` 已补齐 MVP 关键模块并可编译
- `services/api` 默认使用 `sql.js` 启动并自动 seed 演示数据
- `services/api` 已在 PostgreSQL 真实环境完成 migration 验证
- `services/api` 已在 PostgreSQL 真实环境完成登录、当前用户、菜品接口联调
- `apps/web-admin` 已具备真实 Vite 运行链
- `apps/web-admin` 已完成 Chromium 冒烟测试
- `apps/web-admin` 已补齐菜品编辑页的配方与 SOP 编辑能力
- `apps/miniapp` 已具备 `build:weapp / dev:weapp`
- `apps/miniapp` 已完成登录、菜单页、详情页、SOP 展示
- 已补登录、ingredient、dish、user、store 的 HTTP 集成测试
- 已补成本计算单测
- 已补 Postman 集合、本地交付手册、生产部署文档

当前仍未完成：

- 小程序仍缺微信开发者工具中的真实运行时冒烟
- 管理后台和小程序仍缺更完整的人工验收

## P0：工程基线

- 统一包管理器为 `npm`
- 修复根目录 `build`
- 修复根目录 `lint`
- 修复根目录 `test`
- 补齐根目录 `.env.example`
- 补齐 `services/api/.env.example`
- 更新 `README.md`

## P1：后端最小闭环

- 修复 `services/api/src/main.ts` 缺失模块引用
- 补齐 `auth` 模块
- 补齐 `store` 模块
- 补齐 `user` 模块
- 补齐 `dish` 模块
- 补齐 `ingredient` 模块依赖
- 补齐 `costing` 模块
- 修复重复 API 前缀风险
- `services/api` 可编译
- 默认开发数据库可启动并自动 seed
- PostgreSQL 真实环境可执行 migration
- PostgreSQL 真实环境可启动并完成关键接口联调
- 增加 migration
- 增加 seed
- 增加 Postman 文档

## P2：管理后台

- 初始化 `apps/web-admin`
- 补齐基础目录结构
- 补齐最小页面骨架
- 登录页接入当前 API 契约
- 原料管理页完成 CRUD shell
- 菜品管理页完成 CRUD shell
- 用户管理页完成 CRUD shell
- 门店管理页完成 CRUD shell
- 管理后台具备真实 Vite dev/build
- 菜品编辑页完成配方与 SOP 编辑
- 管理后台完成浏览器冒烟

## P3：小程序

- 初始化 `apps/miniapp`
- 补齐 `src/api/auth.ts`
- 补齐 `src/api/dish.ts`
- 补齐最小页面骨架
- 登录页实现登录 / 继续会话 / 退出会话
- 菜单页实现 API 优先与 mock 回退
- 菜品详情页实现 API 优先与 mock 回退
- SOP 展示完成
- 接入 Taro weapp 构建链
- 补齐 `project.config.json`
- 微信开发者工具真实运行时冒烟

## P4：测试与交付加固

- 成本计算单测
- 登录接口 HTTP 集成测试
- ingredient CRUD HTTP 集成测试
- dish CRUD HTTP 集成测试
- user CRUD HTTP 集成测试
- store CRUD HTTP 集成测试
- 管理后台冒烟测试
- 小程序运行时冒烟测试
- 本地交付运行文档
- 生产部署文档
- 演示账号与演示数据

## 下一步优先级

1. 在微信开发者工具中对 miniapp 做真实运行时冒烟，确认登录、菜单页、详情页、SOP 全流程。
2. 做一轮多端人工回归，覆盖 web-admin 与 miniapp 的核心业务路径。
3. 继续补生产环境监控、反向代理、域名与日志策略说明。