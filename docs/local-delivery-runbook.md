# Fastfood Kitchen Local Delivery Runbook

发布日期：2026-04-08

## 目标

这份手册用于让团队在本地快速启动当前 MVP，并验证 API、管理后台、小程序代码流是否达到可交付准备状态。

## 环境要求

- Node.js `24.14.1` 或更高
- npm `11.11.0` 或更高
- WSL Ubuntu 环境
- 如果要做真库验证，需要本机 PostgreSQL

## 1. 安装依赖

```bash
npm install
```

## 2. 准备环境变量

根目录：

```bash
cp .env.example .env
```

后端：

```bash
cp services/api/.env.example services/api/.env
```

默认本地开发使用 `sql.js`，无需先准备 PostgreSQL。

演示账号：

- 用户名：`admin`
- 密码：`admin1234`

## 3. 启动后端

```bash
npm run dev:api
```

默认行为：

- 自动创建本地 `sql.js` 数据文件
- 自动注入演示门店、管理员、原料、菜品数据

## 4. 启动管理后台

```bash
npm run dev:web-admin
```

默认地址：

- [http://localhost:4173](http://localhost:4173)

如需指定 API 地址：

```bash
VITE_API_BASE_URL=http://127.0.0.1:3000/api npm run dev:web-admin
```

## 5. 启动小程序构建链

```bash
npm run dev:miniapp
```

当前行为：

- 运行 `taro build --type weapp --watch`
- 输出微信小程序构建产物到 `apps/miniapp/dist`
- 可直接导入微信开发者工具

如需指定小程序 API 地址：

```bash
TARO_APP_API_BASE_URL=http://127.0.0.1:3000/api npm run dev:miniapp
```

## 6. PostgreSQL 真库验证

如果要验证迁移和真实数据库启动，请在 `services/api/.env` 中改成 PostgreSQL 配置。

如果当前角色不能建库，请直接使用已有数据库，并设置：

```bash
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_existing_database
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

然后执行：

```bash
npm run migration:run --workspace=api
npm run dev:api
```

## 7. 基础验证

整仓：

```bash
npm run build
npm run lint
npm run test
npm run smoke:web-admin
```

后端接口：

- 使用 [fastfood-kitchen-api.postman_collection.json](/wsl$/Ubuntu/home/administrator/.openclaw/workspace/fastfood-kitchen/docs/fastfood-kitchen-api.postman_collection.json)
- 重点验证：
- `/api/auth/login`
- `/api/auth/me`
- `/api/ingredients`
- `/api/dishes`
- `/api/users`
- `/api/stores`

## 8. 当前已确认

- 后端默认开发环境可启动
- 后端可自动 seed 演示数据
- PostgreSQL 迁移可执行
- PostgreSQL 环境下登录、当前用户、菜品接口已完成联调
- 登录、原料、菜品、用户、门店已覆盖 HTTP 集成测试
- 管理后台具备真实 Vite 运行链
- 管理后台具备真实 Chromium 冒烟脚本
- 小程序已补齐 Taro weapp 构建链
- 小程序已完成登录、菜单页、详情页、SOP 展示代码

## 9. 当前剩余项

- 小程序仍缺微信开发者工具中的真实运行时冒烟验收
- 管理后台仍缺更完整的人工回归
- 菜品编辑页的配方与 SOP 编辑能力仍待补强
- 生产部署细节仍可继续完善
