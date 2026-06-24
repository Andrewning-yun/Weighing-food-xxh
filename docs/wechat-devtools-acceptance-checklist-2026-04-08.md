# 微信开发者工具逐步验收单

发布日期：2026-04-08
项目：Fastfood Kitchen Miniapp
适用范围：`apps/miniapp` weapp 端真实运行时验收

## 1. 验收前准备

- [ ] 已执行 `npm install`
- [ ] 已执行 `npm run build --workspace=miniapp`
- [ ] 已确认后端 API 可访问
- [ ] 已确认测试账号可用
  - 用户名：`admin`
  - 密码：`admin1234`
- [ ] 已打开微信开发者工具
- [ ] 已准备截图保存目录

## 2. 导入与启动

### 2.1 导入项目

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择：
   `/home/administrator/.openclaw/workspace/fastfood-kitchen/apps/miniapp/dist`
4. 确认小程序 AppID 使用本次测试可用配置。
5. 点击“导入”并等待编译完成。

验收点：

- [ ] 项目可成功导入
- [ ] 首次编译无阻塞性报错
- [ ] 首页成功进入登录页

证据：

- [ ] 截图：开发者工具首页与编译结果

## 3. 登录页验收

页面路径：`pages/login/index`

执行步骤：

1. 确认页面展示用户名、密码输入框。
2. 确认页面展示 `Sign in`、`Continue with current session`、`Sign out` 按钮。
3. 输入测试账号 `admin / admin1234`。
4. 点击 `Sign in`。

验收点：

- [ ] 登录页可正常打开
- [ ] 输入框可编辑
- [ ] 点击 `Sign in` 后出现加载态
- [ ] 登录成功后跳转到菜品列表页
- [ ] 若本地已有会话，页面可展示 `Current session`

异常记录：

- [ ] 若失败，记录错误文案并截图

## 4. 菜单页验收

页面路径：`pages/dishes/index`

执行步骤：

1. 登录成功后进入菜单页。
2. 观察顶部统计卡片和当前会话摘要。
3. 确认搜索框可输入关键字。
4. 点击 `Refresh` 刷新列表。
5. 点击 `My page` 跳转我的页，再返回菜单页。
6. 输入存在的菜品关键字进行筛选。
7. 输入一个不存在的关键字，观察空结果状态。

验收点：

- [ ] 菜单页可展示菜品列表
- [ ] 当前登录人摘要显示正常
- [ ] 菜品卡片可展示名称、分类、工位、成本/售价、原料数、SOP 步数
- [ ] 无封面图片时显示默认占位态
- [ ] 搜索功能正常
- [ ] 空搜索结果提示正常
- [ ] `Refresh` 可正常刷新
- [ ] `My page` 跳转正常

证据：

- [ ] 截图：菜单页正常状态
- [ ] 截图：菜单页空搜索结果状态

## 5. 菜品详情页验收

页面路径：`pages/dishes-detail/index`

执行步骤：

1. 在菜单页点击任一 `View SOP`。
2. 进入详情页后观察菜品标题、分类、工位、成本、售价、毛利。
3. 检查原料区块是否显示内容。
4. 检查 SOP 区块是否显示步骤内容。
5. 点击 `My page` 跳转我的页。
6. 返回菜单页，再次进入详情页。

验收点：

- [ ] 详情页可成功打开
- [ ] 菜品基础信息展示正常
- [ ] 原料列表展示正常
- [ ] SOP 步骤展示正常
- [ ] 无封面图时默认占位态正常
- [ ] 若菜品无原料或无 SOP，空态提示正常
- [ ] `Back` 返回正常
- [ ] `My page` 跳转正常

证据：

- [ ] 截图：详情页正常状态

## 6. 我的页验收

页面路径：`pages/my/index`

执行步骤：

1. 从菜单页或详情页进入 `My page`。
2. 观察页面顶部会话摘要。
3. 检查以下信息是否展示：
   - Display name
   - Username
   - Role
   - Store
   - Session
4. 点击 `Refresh profile`。
5. 点击 `Go to dishes` 返回菜单页。

验收点：

- [ ] 我的页可成功打开
- [ ] 当前用户信息展示正常
- [ ] `Store` 字段展示门店名或门店 ID
- [ ] `Session` 状态展示正常
- [ ] `Refresh profile` 可刷新资料
- [ ] `Go to dishes` 返回正常

证据：

- [ ] 截图：我的页正常状态

## 7. 退出登录验收

执行步骤：

1. 在我的页点击 `Sign out`。
2. 确认页面返回登录页。
3. 再次访问菜单页或详情页路径，确认未登录时会回到登录页。

验收点：

- [ ] 点击 `Sign out` 后返回登录页
- [ ] 会话被清理
- [ ] 未登录状态下无法直接进入菜单页

证据：

- [ ] 截图：退出登录后的登录页

## 8. 异常场景建议补测

如时间允许，建议额外验证以下场景：

- [ ] 断开 API 后重新打开菜单页，错误提示是否可见
- [ ] 菜品列表为空时空态是否正常
- [ ] 详情页传入无效 `id` 时是否显示默认提示
- [ ] 连续点击 `Refresh` 是否出现异常

## 9. 结果记录

本轮结果请同步填写：

- [test-execution-record-template-2026-04-08.md](/wsl$/Ubuntu/home/administrator/.openclaw/workspace/fastfood-kitchen/docs/test-execution-record-template-2026-04-08.md)
- [multi-end-regression-checklist-2026-04-08-v2.md](/wsl$/Ubuntu/home/administrator/.openclaw/workspace/fastfood-kitchen/docs/multi-end-regression-checklist-2026-04-08-v2.md)

建议补充附件：

- 登录页截图
- 菜单页截图
- 详情页截图
- 我的页截图
- 退出登录截图
- 如有问题，附错误提示截图和控制台日志

## 10. 最终结论

- [ ] 本轮微信开发者工具验收通过
- [ ] 本轮微信开发者工具验收部分通过
- [ ] 本轮微信开发者工具验收不通过

阻塞问题：

- [ ] 无
- [ ] 有，请在测试执行记录中登记
