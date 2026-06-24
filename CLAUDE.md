# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

```
fastfood-kitchen/
├── services/api/          # NestJS backend (Port 3000)
├── apps/web-admin/        # Next.js 14 App Router dashboard (Port 4173)
├── apps/miniapp/          # Taro WeChat miniapp
├── apps/mobile/           # Reserved (not active)
├── packages/config/       # Shared constants, role mappings, token keys, Station/Category enums
├── packages/api-client/   # Shared API request builder + endpoint client
├── packages/design-tokens/# Design token constants (colors, palette)
├── packages/domain/       # Shared TypeScript domain types
├── packages/tooling/      # Shared dev tooling
├── packages/ui/           # Reserved shared UI (not active)
├── scripts/               # Smoke tests
└── docs/                  # Runbooks, checklists, Postman collection
```

## Commands

```bash
# Install (Node >=24.14.0, npm >=11.11.0)
npm install

# Dev servers (run in separate terminals)
npm run dev:api          # NestJS backend — ts-node src/main.ts → :3000
npm run dev:web-admin    # Next.js dev → :4173, proxies /api → :3000
npm run dev:miniapp      # Taro weapp build --watch

# Build all workspaces
npm run build

# Single-workspace builds
npm run build --workspace=api          # tsc → dist/
npm run build --workspace=web-admin    # next build
npm run build --workspace=miniapp      # taro build --type weapp

# Lint
npm run lint                             # all workspaces
npm run lint --workspace=api             # tsc --noEmit
npm run lint --workspace=web-admin       # next lint
npm run lint --workspace=miniapp         # tsc --noEmit

# API-specific
npm run build --workspace=api && npm run migration:run --workspace=api
npm run build --workspace=api && npm run migration:revert --workspace=api
npm run build --workspace=api && node --test "dist/modules/costing/*.test.js" --workspace=api

# Smoke test (requires dev:web-admin running on :4173)
npm run smoke:web-admin
```

## Architecture

### Backend (services/api)

NestJS 10 + TypeORM 10 + Express. CommonJS module system. Default database is `sql.js` (file-based SQLite at `.data/fastfood-kitchen.sqlite`, no external DB needed). Can switch to PostgreSQL via env vars.

**API response envelope**: All endpoints return `{ success: boolean, data: T }` (or `{ success: boolean, data: T, message: string }`). The `success` field signals pass/fail; actual payload is in `data`.

**Auth**: JWT-based. Login at `POST /api/auth/login` returns `{ success, data: { token, user } }`. All authenticated endpoints require `Authorization: Bearer <token>`. JWT payload includes: `sub`, `username`, `role`, `storeId`, `station`.

**Module organization**: Each domain entity has its own NestJS module under `src/modules/<name>/`. Modules follow NestJS convention: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, with optional `dto/` subdirectory. Module registration requires three places:
1. Import entity in `app.module.ts` → `TypeOrmModule.forFeature([...])`
2. Import module in `app.module.ts` → `imports: [...]`
3. Add entity to `database/data-source.ts` → `entities: [...]` (for production migrations)

**Role-based access control**: `@Roles(...)` decorator on controllers, enforced by `AuthGuard` which reads `UserRole` from the JWT. Eight roles defined in `UserRole` enum (`user.entity.ts`):

| Role | Label | Scope |
|------|-------|-------|
| `admin` | 管理员 | Full access, no station filter |
| `chef_manager` | 厨房主管 | Full lunch management, no station filter |
| `chef` | 厨师 | Lunch view + dish edit (audited if not admin/chef_manager) |
| `prep` | 备料员 | View + inventory |
| `breakfast_chef` | 早餐主厨 | Breakfast management (dish CRUD → audit) |
| `breakfast_assistant` | 早餐帮工 | Breakfast view (dish CRUD → audit) |
| `buyer` | 采购 | Purchasing + audit |
| `store_manager` | 门店经理 | Daily reports + store management |

### Station System (工位)

Five station values, synchronized across backend entity (`dish.entity.ts` → `Station` enum), `packages/config`, and `packages/domain`:

| Station | Label | Physical Role |
|---------|-------|---------------|
| `wok` | 炒锅 | Wok cooking (chef, chef_manager) |
| `grill_fry_steam` | 煎扒蒸菜 | Grill/fry/steam combined |
| `prep` | 切配 | Prep/cutting |
| `breakfast_wok` | 早餐炒锅 | Breakfast wok (breakfast_chef) |
| `breakfast_assist` | 早餐副手 | Breakfast assist (breakfast_assistant) |

**Key design rules**:
- Each `Dish` has a `station` field — dishes are tagged by which station produces them
- Each `User` has a `station` field (`user.entity.ts:44`) — determines which dishes the user sees
- `admin` and `chef_manager` have `station = null` — they see ALL stations' dishes
- JWT payload carries `station` so both web-admin and miniapp can filter without extra API calls
- Station filtering is a **frontend concern** — API returns all dishes, frontend filters by `user.station`
- Miniapp menu-plan page: `filterByStation` is `true` unless role is `admin` or `chef_manager`

### Audit Workflow

Breakfast roles (`breakfast_chef`, `breakfast_assistant`) can create/modify dishes but their changes enter audit review. In `dish.service.ts`, when `resolveActor()` detects a breakfast role:
1. Instead of saving directly, an `AuditRecord` is created with `action: 'create'` or `'update'`
2. The response returns `{ auditSubmitted: true, auditId, status: 'pending' }` 
3. Admin/chef_manager approve via the existing audit center (web-admin sidebar "审核中心")

Both web-admin and miniapp detect `auditSubmitted` in the response and show appropriate toast messages.

### Supplementary Order Module (补单)

New module (`services/api/src/modules/supplementary-order/`). During meal service, station operators can add extra dishes to today's menu plan.

- **Entity**: `SupplementaryOrder` — id, storeId, date, mealType, menuPlanId, dishId, dishName, station, userId, userName, reason, estimatedQuantity
- **API**: `POST /supplementary-orders` (create), `GET /supplementary-orders?menuPlanId=` (list), `GET /supplementary-orders/by-date?date=&storeId=` (list by date), `DELETE /supplementary-orders/:id` (revoke)
- **Permissions**: CHEF, PREP, BREAKFAST_CHEF, BREAKFAST_ASSISTANT can create; ADMIN, CHEF_MANAGER can delete
- **UI**: Miniapp menu-plan page has "补单" button → popup shows station-filtered dishes + reason/qty inputs + existing orders with revoke. Web-admin menu-plans page has "补单" button on each plan → card with table of all supplementary orders.

### Store & Pinyin Code Generation

When creating a store, the store code is auto-generated from the Chinese name using `pinyin-pro`: first letters of each character's pinyin, lowercased (e.g., "深圳南山店" → "sznsd"). The code field is read-only. The store form uses "地址" (address) label, not "城市" (city).

### Web Admin (apps/web-admin)

Next.js 14.2 App Router + TDesign React 1.16 + Zustand + SWR.

**Critical architectural constraints**:
- **TDesign React is NOT SSR-safe**. Every page and component using TDesign MUST have `'use client'` directive.
- **CSS**: TDesign styles imported via `import 'tdesign-react/es/style/index.css'` in the root layout (client component). Custom design tokens in `app/globals.css`. Do NOT use `@import` for TDesign CSS — it disables Next.js built-in CSS handling.
- **Root layout is a client component** (due to TDesign ConfigProvider requirement).

**Route structure**:
```
app/
├── layout.tsx              # Root: ConfigProvider + AuthGate + CSS imports
├── globals.css             # Design tokens, layout utilities, auth panel styles
├── login/page.tsx          # Login route (public)
├── middleware.ts            # Cookie-based route guard (Edge)
└── (dashboard)/            # Route group — all protected pages
    ├── layout.tsx           # ShellLayout wrapper
    ├── ingredients/page.tsx # Thin wrapper → @/features/ingredients
    ├── dishes/page.tsx
    └── ... (17 routes total)
```

**Auth flow** (dual-layer):
1. **Middleware** (`src/middleware.ts`): Checks `web-admin-token` cookie. Redirects to `/login` if missing.
2. **AuthGate** (`src/lib/auth-gate.tsx`): Client component. On mount, calls `fetchCurrentUser()` to validate token and populate Zustand user store.
3. **Login**: `LoginPage` calls `login()` → `storeToken()` writes to localStorage + cookie → redirect.
4. Token is stored in both `localStorage` (for API calls via `getToken()`) and `document.cookie` (for middleware).

**Shared components**:
- `DataTable<T>` — Generic table wrapper with search, pagination, loading states.
- `ShellLayout` — Sidebar + header layout. Filters routes by user role via `canAccessRoute()`.
- `showDeleteConfirm()` — TDesign Dialog-based delete confirmation.

**Page wrapper pattern**: Each route under `(dashboard)/<name>/page.tsx` is a 3-line file:
```tsx
'use client';
export { XxxPage as default } from '@/features/xxx';
```
All business logic lives in `src/features/<name>.tsx`.

**Path alias**: `@/` → `./src/` (configured in `tsconfig.json`).

**API proxy**: Next.js `rewrites()` proxies `/api/*` → `http://127.0.0.1:3000/api/*`. Override via `API_BASE_URL` env var.

### Miniapp (apps/miniapp)

Taro 3.6 WeChat Mini Program + NutUI React Taro. Pages in `src/pages/*/index.tsx`. API client in `src/api/*.ts` — each domain has its own file exporting typed request functions. Entry: `pages/login/index`. API base URL configurable via `TARO_APP_API_BASE_URL` env var.

Key pages: `login`, `menu-plan` (menu planning + supplementary orders + score/recommendations), `dish-edit`, `dish-detail`, `my` (profile).

### Shared Packages

- **`@fastfood-kitchen/config`**: All shared constants — `Station`, `DishCategory`, `UserRole`/`ApiRole`, `MealType`, token keys, default URLs, label maps, `normalizeStation()`, `normalizeCategory()`, role mapping functions. This is the **authoritative source for enums used by both frontends**.
- **`@fastfood-kitchen/api-client`**: `createApiRequest()`, `createApiClient()` — builds authenticated API request functions.
- **`@fastfood-kitchen/design-tokens`**: Color palette constants used to generate CSS custom properties.
- **`@fastfood-kitchen/domain`**: Shared TypeScript domain types (mirrors some enums from config — keep in sync).

## Monorepo Caveats

- npm workspaces with hoisted dependencies. Workspace packages reference each other via `"@fastfood-kitchen/*": "1.0.0"` in `dependencies`.
- TypeScript paths: web-admin uses `@/*` → `src/*`. API uses standard NestJS paths.
- The shared packages must be listed in `next.config.mjs` → `transpilePackages` for Next.js to process their ESM exports.
- Windows: use `bash` (WSL/Git Bash) for shell commands. Always use forward slashes in paths.
- When adding a new API module: register entity in `app.module.ts` (both `forFeature` and `imports`), add entity to `data-source.ts`, create migration, and add to `data-source.ts` migrations array.

## Key Entities (Database)

| Entity | Table | Key Fields |
|--------|-------|------------|
| Store | store | id, name, code (auto pinyin), address |
| User | user | id, username, role (enum), storeId, station, wechatOpenId |
| Dish | dish | id, name, category, station, mealType, isActive, ingredients (JSON), steps (JSON) |
| Ingredient | ingredient | id, name, unit, stock, minStock, cost, category |
| MenuPlan | menu_plan | id, storeId, date, mealType, dishes (JSON), status |
| DailyInventory | daily_inventory | id, storeId, date, ingredientId, quantity |
| AuditRecord | audit_record | id, entityType, entityId, action, submittedBy, status |
| SupplementaryOrder | supplementary_order | id, storeId, date, mealType, menuPlanId, dishId, station, userId, reason, estimatedQuantity |
| OperationLog | operation_log | id, module, action, targetId, operatorId, details (JSON) |

## Git Workflow（半自动化）

每次 Claude 完成代码修改后，会执行以下流程：

### 提交流程
1. Claude 展示本次修改摘要（改了哪些文件、改了什么）
2. Claude **询问你是否要提交** → 你确认后执行
3. 执行 `git add -A && git commit -m "<描述信息>" && git push`
4. 推送成功后告知结果

### 回滚流程
如果需要回滚到之前的版本：
1. 告诉 Claude "回滚到某次提交" 或 "撤销最近的更改"
2. Claude 会执行 `git log --oneline` 展示最近的提交历史
3. 你选择要回滚到的提交
4. Claude 执行 `git revert` 或 `git reset`

### 手动快捷命令（在 Git Bash 中执行）
```bash
# 一键提交+推送（需先认证）
git add -A && git commit -m "做了什么" && git push

# 查看提交历史
git log --oneline -10

# 回滚最近一次提交（保留更改到工作区）
git reset --soft HEAD~1

# 强制回滚到指定提交（丢弃之后所有更改）
git reset --hard <commit-hash>
```

> ⚠️ 首次推送需要先认证一次：`git push -u origin main`，弹出浏览器窗口登录 GitHub 即可，之后凭据会被缓存。
