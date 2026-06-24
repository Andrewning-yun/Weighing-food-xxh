# 自动化产物说明

发布日期：2026-04-08

## 产物目录

所有 Web 冒烟产物统一输出到：

`output/playwright/`

## 当前固定文件

- `web-admin-smoke.png`
- `web-admin-smoke.json`

## 产物内容

### `web-admin-smoke.png`

- 冒烟结束后的页面截图
- 用于保存可视化证据和回溯 UI 状态

### `web-admin-smoke.json`

- API 地址
- Web 地址
- Chromium 路径
- 本次使用的临时原料名称
- 本次使用的临时菜品名称
- 已验证的页面和动作

## 归档规则

- 每次 smoke 执行后保留最新文件
- 如果需要长期留档，按测试轮次另存到独立目录
- 问题单中引用截图和 JSON 文件名即可，不需要复制内容
