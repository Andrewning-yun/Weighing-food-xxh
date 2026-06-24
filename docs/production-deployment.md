# Fastfood Kitchen Production Deployment

发布日期：2026-04-08

## 目标

这份文档定义当前 MVP 的生产发布最小流程，覆盖 API、管理后台和数据库迁移。

## 1. 生产环境要求

- Node.js `24.14.1` 或更高
- npm `11.11.0` 或更高
- PostgreSQL `14+`
- Linux 服务器或容器运行环境

## 2. 后端生产环境变量

建议至少提供：

```bash
PORT=3000
DB_TYPE=postgres
DB_HOST=<postgres-host>
DB_PORT=5432
DB_USER=<postgres-user>
DB_PASSWORD=<postgres-password>
DB_NAME=fastfood_kitchen
DB_SYNCHRONIZE=false
DB_LOGGING=false
SEED_ON_BOOT=false
JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=7d
```

## 3. 安装与构建

```bash
npm install
npm run build
```

## 4. 执行数据库迁移

在 API 工作区执行：

```bash
npm run migration:run --workspace=api
```

当前初始迁移文件：

- [20260408140000-initial-schema.ts](/wsl$/Ubuntu/home/administrator/.openclaw/workspace/fastfood-kitchen/services/api/src/database/migrations/20260408140000-initial-schema.ts)

## 5. 启动后端

```bash
npm run start --workspace=api
```

## 6. 构建管理后台

```bash
npm run build --workspace=web-admin
```

构建产物目录：

- `apps/web-admin/dist`

部署方式建议：

- 由 Nginx 托管静态文件
- 或交给对象存储 / CDN 托管
- 通过 `VITE_API_BASE_URL` 指向生产 API

## 7. 管理后台发布前验证

推荐执行：

```bash
npm run smoke:web-admin
```

输出产物：

- `output/playwright/web-admin-smoke.png`
- `output/playwright/web-admin-smoke.json`

## 8. 小程序交付说明

当前仓库已经具备：

- 登录页
- 菜品列表页
- 菜品详情页
- SOP 展示页

上线前仍需在真实 Taro / 微信小程序环境中补最后一轮人工验收，重点确认：

- 登录态持久化
- 接口域名配置
- 菜品列表真实数据
- 菜品详情与 SOP 展示

## 9. 推荐上线前检查单

- API 生产环境变量已切到 PostgreSQL
- 已执行 migration
- JWT 密钥已替换为正式值
- `SEED_ON_BOOT` 已关闭
- 管理后台已完成浏览器冒烟
- 小程序已完成真机或开发者工具验收
