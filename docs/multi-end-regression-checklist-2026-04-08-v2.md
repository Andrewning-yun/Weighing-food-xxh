# 多端回归清单

发布日期：2026-04-08

## 执行前准备

- [ ] `npm install`
- [ ] 根级环境变量已准备
- [ ] `services/api/.env` 已准备
- [ ] PostgreSQL 数据库连接已确认
- [ ] Chromium 可用
- [ ] 微信开发者工具可用

## 基础工程验证

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run smoke:web-admin`

## API 回归

- [ ] 登录返回 token
- [ ] `/api/auth/me` 返回当前用户
- [ ] 原料列表可访问
- [ ] 菜品列表可访问
- [ ] 用户列表可访问
- [ ] 门店列表可访问

## Web Admin 回归

- [ ] 登录页可登录
- [ ] Ingredients 页可新增原料
- [ ] Ingredients 页可编辑原料
- [ ] Ingredients 页可删除原料
- [ ] Dishes 页可新增菜品
- [ ] Dishes 页可编辑菜品基础信息
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

- [ ] `npm run build:weapp --workspace=miniapp`
- [ ] 微信开发者工具成功打开 `apps/miniapp/dist`
- [ ] 登录页可登录
- [ ] 菜单页可展示菜品
- [ ] 菜单页可进入详情
- [ ] 详情页可展示原料
- [ ] 详情页可展示 SOP
- [ ] 我的页可展示会话信息
- [ ] 可退出登录并回到登录页

## PostgreSQL 回归

- [ ] `npm run migration:run --workspace=api`
- [ ] PostgreSQL 环境 API 可启动
- [ ] PostgreSQL 环境登录成功
- [ ] PostgreSQL 环境菜品接口可访问

## 结果归档

- [ ] 测试执行记录已填写
- [ ] 自动化产物已留存
- [ ] 截图/日志已归档
- [ ] 问题单已登记
