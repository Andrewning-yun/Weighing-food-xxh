# 多端回归清单

发布日期：2026-04-08

## 执行前准备

- [ ] `npm install`
- [ ] 根目录环境变量已准备
- [ ] `services/api/.env` 已准备
- [ ] 若走 PostgreSQL，数据库连接已确认
- [ ] 微信开发者工具已安装
- [ ] Chromium 可用

## 基础工程验证

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run smoke:web-admin`

## API 验证

- [ ] 登录返回 token
- [ ] `/api/auth/me` 返回当前用户
- [ ] 原料列表可读取
- [ ] 菜品列表可读取
- [ ] 用户列表可读取
- [ ] 门店列表可读取

## Web Admin 回归

- [ ] 登录页可登录
- [ ] Ingredients 页可新增原料
- [ ] Ingredients 页可编辑原料
- [ ] Ingredients 页可删除原料
- [ ] Dishes 页可新增菜品
- [ ] Dishes 页可修改菜品基本信息
- [ ] Dishes 页可编辑配方
- [ ] Dishes 页可编辑 SOP
- [ ] Dishes 页可删除菜品
- [ ] Users 页可新增用户
- [ ] Users 页可编辑用户
- [ ] Users 页可删除用户
- [ ] Stores 页可新增门店
- [ ] Stores 页可编辑门店
- [ ] Stores 页可删除门店

## Miniapp 回归

- [ ] `npm run dev:miniapp`
- [ ] 微信开发者工具成功打开 `apps/miniapp/dist`
- [ ] 登录页可登录
- [ ] 登录页可继续会话
- [ ] 菜单页可展示菜品
- [ ] 菜单页可进入详情
- [ ] 详情页可展示原料与 SOP
- [ ] 退出会话后返回登录页

## PostgreSQL 回归

- [ ] `npm run migration:run --workspace=api`
- [ ] PostgreSQL 环境下 API 可启动
- [ ] PostgreSQL 环境下登录成功
- [ ] PostgreSQL 环境下菜品接口可访问

## 验收结论

- [ ] 通过
- [ ] 有阻塞项

## 阻塞项记录

- [ ] 无
