# Fastfood Kitchen Production Deployment（P2 版）

更新日期：2026-08-06

本文件描述基于 **Docker Compose（PostgreSQL 16 + API + Web Admin）** 的云服务器部署方式。真实 Postgres 迁移验证已完成（7 个历史迁移 + schema 对齐迁移全部通过）。

## 1. 环境要求

- 云服务器（Linux x86_64，2C4G 起步）
- Docker 24+ / Docker Compose v2
- 域名 + HTTPS 证书（小程序生产必须使用已备案域名）

## 2. 部署步骤

```bash
# 1) 拉取代码
git clone <repo> /opt/fastfood-kitchen && cd /opt/fastfood-kitchen

# 2) 配置环境变量
cp .env.example .env
# 编辑 .env：DB_PASSWORD / JWT_SECRET 必填，SEED_ON_BOOT 首次 true 建管理员后改 false

# 3) 启动（api 容器启动时自动执行迁移）
docker compose up -d --build

# 4) 验证
curl http://127.0.0.1:3000/api/auth/login -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<你的密码>"}'
```

## 3. 反向代理（Nginx 宿主机）

- 模板：`deploy/nginx.conf`
- web-admin: `http://127.0.0.1:4173`，API: `http://127.0.0.1:3000`
- docker-compose 已把 postgres 绑定 `127.0.0.1:5432`；api/web-admin 容器无需对外暴露（Nginx 走宿主机端口即可，或在 compose 中为两者添加 `127.0.0.1` 端口映射后使用本模板）
- 小程序 `TARO_APP_API_BASE_URL` 指向 `https://<你的域名>/api`，需在微信公众平台配置业务域名（HTTPS + ICP 备案）

## 4. 数据库迁移（手动执行）

```bash
docker compose exec api sh -c "node ../../node_modules/typeorm/cli.js -d dist/database/data-source.js migration:show"
docker compose exec api sh -c "node ../../node_modules/typeorm/cli.js -d dist/database/data-source.js migration:run"
docker compose exec api sh -c "node ../../node_modules/typeorm/cli.js -d dist/database/data-source.js migration:revert"
```

## 5. 数据备份

```bash
# 每日 02:30 备份，保留 14 天（crontab -e）
30 2 * * * docker exec ffk-postgres pg_dump -U postgres -d fastfood_kitchen | gzip > /backup/ffk-$(date +\%Y\%m\%d).sql.gz && find /backup -name 'ffk-*.sql.gz' -mtime +14 -delete
```

## 6. 升级流程

```bash
git pull
docker compose up -d --build      # 迁移自动执行（只进不退）
docker compose ps                 # 确认全部 healthy
```

## 7. 发布前检查单

- [ ] `.env` 已配置强 DB_PASSWORD / JWT_SECRET（`openssl rand -hex 32`）
- [ ] `SEED_ON_BOOT=false`（管理员已创建）
- [ ] `DB_SYNCHRONIZE=false`（schema 走迁移）
- [ ] 迁移已执行：`migration:show` 显示全部 8 个
- [ ] HTTPS 证书生效，`https://<域名>` 可访问
- [ ] 小程序业务域名已配置，真机登录/菜单/填报可用
- [ ] 备份 cron 已部署并试跑一次
- [ ] 登录与各核心接口冒烟通过

## 8. 本地开发

```bash
npm install
npm run dev:api        # sql.js 模式，无需数据库
npm run dev:web-admin
npm run dev:miniapp
```

Postgres 联调（本机 Docker）：

```bash
docker run -d --name ffk-postgres -p 5433:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fastfood_kitchen postgres:16
# services/api/.env 设置 DB_PORT=5433 后：
npm run migration:run --workspace=api
```
