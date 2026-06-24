# Fastfood Kitchen 服务器安装部署指南（从零开始）

适用版本：v2 P1（Taro + NestJS 自托管架构）
更新日期：2026-04-15

---

## 目录

1. [架构概览](#1-架构概览)
2. [服务器选购与初始化](#2-服务器选购与初始化)
3. [安装基础环境](#3-安装基础环境)
4. [安装与配置 PostgreSQL](#4-安装与配置-postgresql)
5. [部署后端 API](#5-部署后端-api)
6. [部署管理后台](#6-部署管理后台)
7. [部署微信小程序](#7-部署微信小程序)
8. [配置 Nginx 反向代理与 HTTPS](#8-配置-nginx-反向代理与-https)
9. [配置域名与微信后台](#9-配置域名与微信后台)
10. [PM2 进程管理](#10-pm2-进程管理)
11. [数据库备份](#11-数据库备份)
12. [日常运维](#12-日常运维)
13. [常见问题排查](#13-常见问题排查)

---

## 1. 架构概览

```
用户端
├── 微信小程序（Taro 编译产物，运行在微信客户端）
├── Web 管理后台（React SPA，Nginx 托管静态文件）
│
服务器
├── Nginx（端口 80/443）
│   ├── api.yourdomain.com → 反向代理到 NestJS API
│   └── admin.yourdomain.com → 静态文件托管
├── NestJS API（端口 3000，PM2 管理）
└── PostgreSQL（端口 5432）
```

### 与 V1 的区别

| 项目 | V1（微信云开发） | V2（自托管） |
|------|----------------|-------------|
| 数据库 | 云数据库 | PostgreSQL |
| 后端 | 云函数 | NestJS 自托管 |
| 部署 | 微信后台一键 | 需自备服务器 |
| 文件存储 | 云存储 | 暂无（后续可接 OSS） |
| 认证 | 云开发自带 | JWT |

### P1 新增功能

本次 P1 版本新增以下模块，对应新的数据库迁移和前端页面：

| 模块 | 说明 |
|------|------|
| 客单价反馈系统 | 基于每日经营数据动态调整菜品推荐权重 |
| 菜品分类标签 | 大荤/小荤/素菜自动判定与手动覆盖 |
| 固定菜品白名单 | 按星期几配置每日必出菜品，不受推荐分影响 |
| 菜单搭配规则 | 按门店配置大荤/小荤/素菜数量要求 |
| 菜单评分引擎 | 4 维度评分（完整度/多样性/新鲜度/毛利结构） |
| 每日经营数据填报 | 客单价、就餐人数、天气（早餐/正餐分开） |
| 菜品剩余反馈 | 记录突出剩余菜品，影响推荐权重 |
| 菜单标准配置 | 各分类最少菜品数量要求 |
| 算法参数配置 | 推荐算法各维度系数可视化调优 |
| AI 接口预留 | Phase 2 接入 LLM 的数据表和 API 骨架 |

---

## 2. 服务器选购与初始化

### 2.1 推荐配置

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 1 核 | 2 核 |
| 内存 | 2 GB | 4 GB |
| 硬盘 | 40 GB SSD | 80 GB SSD |
| 带宽 | 3 Mbps | 5 Mbps |
| 系统 | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

> 一家门店 + 10 人以内使用，2C4G 完全够用。云服务商可选阿里云、腾讯云、华为云。

### 2.2 服务器初始化

```bash
# SSH 登录服务器（替换为你的服务器 IP）
ssh root@YOUR_SERVER_IP

# 更新系统
apt update && apt upgrade -y

# 创建部署用户
adduser deploy
usermod -aG sudo deploy

# 设置时区
timedatectl set-timezone Asia/Shanghai

# 配置防火墙
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# 切换到部署用户
su - deploy
```

---

## 3. 安装基础环境

### 3.1 Node.js 24.x

```bash
# 安装 Node.js 24.x（LTS）
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node -v   # 应输出 v24.x.x
npm -v    # 应输出 11.x.x
```

### 3.2 Nginx

```bash
sudo apt install -y nginx

# 验证
nginx -v

# 启动并设置开机自启
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3.3 PM2（进程管理器）

```bash
sudo npm install -g pm2

# 设置开机自启
pm2 startup
# 按照输出的命令执行（通常是 sudo 开头的一行命令）
```

### 3.4 其他工具

```bash
sudo apt install -y git curl wget unzip
```

---

## 4. 安装与配置 PostgreSQL

### 4.1 安装

```bash
sudo apt install -y postgresql postgresql-contrib

# 启动并设置开机自启
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 4.2 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 命令行中执行：
CREATE USER fastfood WITH PASSWORD '你的强密码';
CREATE DATABASE fastfood_kitchen OWNER fastfood;
GRANT ALL PRIVILEGES ON DATABASE fastfood_kitchen TO fastfood;

# 退出
\q
```

### 4.3 验证连接

```bash
psql -h localhost -U fastfood -d fastfood_kitchen
# 输入密码后应该能登录
\q
```

### 4.4 配置远程访问（可选，不建议生产环境开启）

```bash
# 仅在需要从其他机器连接数据库时配置
sudo vim /etc/postgresql/14/main/pg_hba.conf
# 添加：host  fastfood_kitchen  fastfood  你信任的IP/32  md5

sudo vim /etc/postgresql/14/main/postgresql.conf
# 修改：listen_addresses = 'localhost'

sudo systemctl restart postgresql
```

---

## 5. 部署后端 API

### 5.1 获取代码

方式一：从本地构建后上传

```bash
# 在本地开发机器上
cd fastfood-kitchen

# 安装依赖
npm install

# 构建
npm run build --workspace=api
```

```bash
# 在服务器上创建目录
sudo mkdir -p /opt/fastfood-kitchen
sudo chown deploy:deploy /opt/fastfood-kitchen

# 从本地上传（在本地机器执行）
rsync -avz --exclude='node_modules' \
  . deploy@YOUR_SERVER_IP:/opt/fastfood-kitchen/
```

方式二：从 Git 仓库拉取

```bash
cd /opt/fastfood-kitchen
git clone YOUR_REPO_URL .
npm install
npm run build --workspace=api
```

### 5.2 安装生产依赖

```bash
cd /opt/fastfood-kitchen
npm install --omit=dev
```

### 5.3 创建环境变量文件

```bash
mkdir -p /opt/fastfood-kitchen/services/api
cat > /opt/fastfood-kitchen/services/api/.env << 'EOF'
# 服务端口
PORT=3000

# 数据库（PostgreSQL）
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=fastfood
DB_PASSWORD=你的强密码
DB_NAME=fastfood_kitchen
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT 认证
JWT_SECRET=这里填一个64位随机字符串
JWT_EXPIRES_IN=7d

# 种子数据（首次启动设为 true，之后改为 false）
SEED_ON_BOOT=true

# 管理员账号（首次种子时创建）
DEMO_ADMIN_USERNAME=admin
DEMO_ADMIN_PASSWORD=你的管理员密码
EOF

# 保护 .env 文件权限
chmod 600 /opt/fastfood-kitchen/services/api/.env
```

生成 JWT 密钥：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# 将输出复制到 JWT_SECRET
```

### 5.4 执行数据库迁移

```bash
cd /opt/fastfood-kitchen
npm run migration:run --workspace=api
```

迁移文件会按顺序执行：

1. `20260408140000-initial-schema.ts` — 创建基础表（store, user, ingredient, dish 等）
2. `20260412000000-add-v1-features.ts` — 创建 v1 功能表（daily_inventories, menu_plans, tasks, operation_logs）
3. `20260413000000-add-recommendation-system.ts` — **P1 新增**：创建推荐系统相关表（daily_metrics, dish_feedback, menu_standards, default_dishes, algorithm_config, dish_type_tags, menu_pairing_rules, ai_suggestions）并为 store 表新增目标客单价、称重单价等字段

> 如果是从旧版本升级到 P1，只需执行第 3 个迁移，前两个已执行过的不会重复执行。

### 5.5 启动 API

```bash
cd /opt/fastfood-kitchen
pm2 start services/api/dist/main.js --name fastfood-api

# 查看日志确认启动成功
pm2 logs fastfood-api

# 应看到：
# [Nest] LOG [DevSeedService] Development seed is ready
# [Nest] LOG [NestApplication] Nest application successfully started
```

### 5.6 验证 API

```bash
# 健康检查
curl http://localhost:3000/api

# 测试登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"你的管理员密码"}'

# 应返回 JWT token
```

### 5.7 保存 PM2 配置

```bash
pm2 save
# 这样服务器重启后 PM2 会自动恢复
```

---

## 6. 部署管理后台

### 6.1 构建

```bash
cd /opt/fastfood-kitchen

# 设置 API 地址（构建时注入）
export VITE_API_BASE_URL=https://api.yourdomain.com/api

npm run build --workspace=web-admin
```

### 6.2 配置 Nginx 托管

```bash
sudo vim /etc/nginx/sites-available/admin.yourdomain.com
```

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    root /opt/fastfood-kitchen/apps/web-admin/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 可选：API 代理（开发阶段解决跨域）
    # 生产环境建议直接配置 VITE_API_BASE_URL
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/admin.yourdomain.com /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载
sudo systemctl reload nginx
```

---

## 7. 部署微信小程序

### 7.1 构建

```bash
cd /opt/fastfood-kitchen

# 小程序的 API 地址在 Taro 编译时通过 defineConstants 注入
# 编辑 apps/miniapp/config/production.js 或在构建命令中设置

npm run build --workspace=miniapp
```

构建产物在 `apps/miniapp/dist/` 目录。

### 7.2 配置小程序

1. 用**微信开发者工具**打开 `apps/miniapp/dist/`
2. 修改 `project.config.json`：

```json
{
  "appid": "你的小程序AppID",
  "setting": {
    "urlCheck": true
  }
}
```

3. 确认 API 地址指向生产域名（`https://api.yourdomain.com/api`）

### 7.3 上传与发布

1. 在微信开发者工具中点击「上传」
2. 登录 [微信公众平台](https://mp.weixin.qq.com)
3. 版本管理 → 设为体验版 → 提交审核 → 发布

---

## 8. 配置 Nginx 反向代理与 HTTPS

### 8.1 API 反向代理

```bash
sudo vim /etc/nginx/sites-available/api.yourdomain.com
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持（如后续需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 8.2 HTTPS（Let's Encrypt 免费证书）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 为 API 域名申请证书
sudo certbot --nginx -d api.yourdomain.com

# 为管理后台域名申请证书
sudo certbot --nginx -d admin.yourdomain.com

# 自动续期（Certbot 会自动设置 cron）
sudo certbot renew --dry-run
```

> 微信小程序**强制要求 HTTPS**，必须配置 SSL 证书。

---

## 9. 配置域名与微信后台

### 9.1 域名解析

在你的域名服务商控制台添加 A 记录：

| 主机记录 | 类型 | 值 |
|---------|------|-----|
| api | A | 你的服务器 IP |
| admin | A | 你的服务器 IP |

### 9.2 微信小程序后台配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 开发管理 → 开发设置 → 服务器域名
3. request 合法域名：`https://api.yourdomain.com`
4. 如有文件上传需求，添加 uploadFile 和 downloadFile 域名

---

## 10. PM2 进程管理

### 10.1 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs fastfood-api

# 重启
pm2 restart fastfood-api

# 停止
pm2 stop fastfood-api

# 监控面板
pm2 monit
```

### 10.2 配置日志轮转

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 10.3 使用 ecosystem.config.js（推荐）

```bash
cat > /opt/fastfood-kitchen/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'fastfood-api',
    script: 'services/api/dist/main.js',
    cwd: '/opt/fastfood-kitchen',
    env: {
      NODE_ENV: 'production',
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
    error_file: '/opt/fastfood-kitchen/logs/error.log',
    out_file: '/opt/fastfood-kitchen/logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
EOF

mkdir -p /opt/fastfood-kitchen/logs

# 使用配置文件启动
pm2 start ecosystem.config.js
pm2 save
```

---

## 11. 数据库备份

### 11.1 手动备份

```bash
pg_dump -h localhost -U fastfood fastfood_kitchen > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 11.2 自动备份（Cron）

```bash
# 创建备份目录
mkdir -p /opt/fastfood-kitchen/backups

# 添加定时任务
crontab -e
```

添加以下行（每天凌晨 3 点备份）：

```
0 3 * * * pg_dump -h localhost -U fastfood fastfood_kitchen | gzip > /opt/fastfood-kitchen/backups/daily_$(date +\%Y\%m\%d).sql.gz && find /opt/fastfood-kitchen/backups -name "daily_*.sql.gz" -mtime +30 -delete
```

### 11.3 恢复备份

```bash
gunzip -c backup_20260412.sql.gz | psql -h localhost -U fastfood fastfood_kitchen
```

---

## 12. 日常运维

### 12.1 更新部署

```bash
# 在服务器上
cd /opt/fastfood-kitchen
git pull origin main                    # 拉取最新代码
npm install                             # 更新依赖
npm run build --workspace=api           # 重新构建 API
npm run migration:run --workspace=api   # 执行新的数据库迁移
pm2 restart fastfood-api                # 重启服务

# 如果管理后台也有更新
npm run build --workspace=web-admin
# Nginx 会自动提供新文件
```

### 12.2 查看日志

```bash
# API 日志
pm2 logs fastfood-api --lines 100

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 日志
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 12.3 监控

```bash
# 磁盘空间
df -h

# 内存使用
free -h

# CPU 和内存
top

# PM2 监控
pm2 monit

# 数据库连接数
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='fastfood_kitchen';"
```

---

## 13. 常见问题排查

### Q: API 启动失败，数据库连接报错

```bash
# 检查 PostgreSQL 是否运行
sudo systemctl status postgresql

# 检查数据库连接
psql -h localhost -U fastfood -d fastfood_kitchen

# 检查 .env 配置是否正确
cat /opt/fastfood-kitchen/services/api/.env
```

### Q: 微信小程序请求失败

1. 确认服务器域名已配置 HTTPS
2. 确认在微信后台添加了 request 合法域名
3. 确认 API 地址使用 `https://` 而非 `http://`
4. 检查 Nginx 是否正常代理：`curl -v https://api.yourdomain.com/api`

### Q: 管理后台白屏

1. 检查 Nginx 配置中 `try_files $uri $uri/ /index.html;` 是否存在
2. 检查浏览器控制台是否有 JS 报错
3. 确认构建时 `VITE_API_BASE_URL` 设置正确

### Q: PM2 进程反复重启

```bash
pm2 logs fastfood-api --err --lines 50
# 查看错误日志定位原因
```

### Q: 数据库迁移失败

```bash
# 查看当前迁移状态
npm run migration:show --workspace=api

# 回滚上一次迁移
npm run migration:revert --workspace=api
```

### Q: 如何重置数据库

```bash
# 警告：这会删除所有数据！
sudo -u postgres psql -c "DROP DATABASE fastfood_kitchen;"
sudo -u postgres psql -c "CREATE DATABASE fastfood_kitchen OWNER fastfood;"

# 重新迁移
cd /opt/fastfood-kitchen
# 临时开启种子数据
sed -i 's/SEED_ON_BOOT=false/SEED_ON_BOOT=true/' services/api/.env
npm run migration:run --workspace=api
pm2 restart fastfood-api

# 种子完成后关闭
sed -i 's/SEED_ON_BOOT=true/SEED_ON_BOOT=false/' services/api/.env
pm2 restart fastfood-api
```

### Q: 从旧版本升级到 P1

```bash
cd /opt/fastfood-kitchen
git pull origin main
npm install
npm run build --workspace=api

# 执行迁移（已执行过的会自动跳过）
npm run migration:run --workspace=api

pm2 restart fastfood-api
```

P1 新增的迁移会：
- 在 `store` 表新增目标客单价、称重单价、米饭价格等字段
- 创建 8 张新表（daily_metrics, dish_feedback, menu_standards, default_dishes, algorithm_config, dish_type_tags, menu_pairing_rules, ai_suggestions）
- 种子数据自动写入默认配置（菜单标准、搭配规则、算法参数、菜品分类标签）

---

## 附录 A：环境变量速查

| 变量 | 说明 | 开发默认值 | 生产建议 |
|------|------|-----------|---------|
| `PORT` | API 端口 | 3000 | 3000 |
| `DB_TYPE` | 数据库类型 | sqljs | postgres |
| `DB_HOST` | 数据库主机 | localhost | localhost |
| `DB_PORT` | 数据库端口 | 5432 | 5432 |
| `DB_USER` | 数据库用户 | postgres | fastfood |
| `DB_PASSWORD` | 数据库密码 | postgres | 强密码 |
| `DB_NAME` | 数据库名 | fastfood_kitchen | fastfood_kitchen |
| `DB_SYNCHRONIZE` | 自动同步表结构 | true | **false** |
| `DB_LOGGING` | SQL 日志 | true | false |
| `JWT_SECRET` | JWT 密钥 | dev-secret | 64位随机字符串 |
| `JWT_EXPIRES_IN` | Token 过期时间 | 7d | 7d |
| `SEED_ON_BOOT` | 启动时种子数据 | true | **false** |

## 附录 B：端口清单

| 端口 | 服务 | 对外暴露 |
|------|------|---------|
| 80 | Nginx HTTP | 是 |
| 443 | Nginx HTTPS | 是 |
| 3000 | NestJS API | 否（通过 Nginx 代理） |
| 5432 | PostgreSQL | 否 |

## 附录 C：文件目录结构

```
/opt/fastfood-kitchen/
├── services/
│   └── api/
│       ├── dist/               # 编译产物
│       ├── src/                # 源代码
│       ├── .env                # 环境变量（chmod 600）
│       └── package.json
├── apps/
│   ├── web-admin/
│   │   └── dist/               # 管理后台静态文件
│   └── miniapp/
│       └── dist/               # 小程序编译产物（需下载到本地上传）
├── logs/                       # PM2 日志
├── backups/                    # 数据库备份
├── ecosystem.config.js         # PM2 配置
└── package.json
```

## 附录 D：P1 新增 API 速查

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 每日经营数据 | GET | `/api/daily-metrics` | 查询（按 storeId/date/mealType 筛选） |
| | POST | `/api/daily-metrics` | 填报 |
| | PUT | `/api/daily-metrics/:id` | 修改 |
| 菜品反馈 | GET | `/api/dish-feedback` | 查询 |
| | POST | `/api/dish-feedback` | 填报 |
| | PUT | `/api/dish-feedback/:id` | 修改 |
| 菜单标准 | GET | `/api/menu-standards` | 查询 |
| | PUT | `/api/menu-standards` | 批量更新 |
| 固定菜品 | GET | `/api/default-dishes` | 查询 |
| | PUT | `/api/default-dishes` | 批量更新 |
| 算法配置 | GET | `/api/algorithm-config` | 查询 |
| | PUT | `/api/algorithm-config` | 更新（仅 admin） |
| 菜品分类标签 | GET | `/api/dish-type-tags` | 查询所有 |
| | POST | `/api/dish-type-tags` | 新增（仅 admin） |
| | PUT | `/api/dish-type-tags/:id` | 修改（仅 admin） |
| | DELETE | `/api/dish-type-tags/:id` | 删除（仅 admin） |
| 搭配规则 | GET | `/api/menu-pairing-rules` | 查询 |
| | PUT | `/api/menu-pairing-rules` | 批量更新 |
| 菜单评分 | POST | `/api/menu-score` | 对菜单进行 4 维度评分 |
| 推荐（增强） | GET | `/api/costing/recommendations` | 新增多维度评分与原因说明，排除固定菜品 |
