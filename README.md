# fastfood-kitchen

Fastfood Kitchen is a monorepo for kitchen recipe, SOP, and costing management.

## Workspaces

- `services/api`: NestJS backend API
- `apps/web-admin`: admin dashboard MVP
- `apps/miniapp`: Taro weapp kitchen miniapp MVP
- `apps/mobile`: reserved for a later release
- `packages/domain`: shared domain types
- `packages/config`: shared environment and cross-app constants
- `packages/api-client`: shared API request and endpoint client

## Local Setup

Requirements:

- Node.js `24.14.1` or newer
- npm `11.11.0` or newer
- WSL Ubuntu recommended

Install dependencies:

```bash
npm install
```

Copy environment files if needed:

```bash
cp .env.example .env
cp services/api/.env.example services/api/.env
```

## Development Mode

The backend defaults to `sql.js` for local MVP boot, so PostgreSQL is optional unless you want to validate migrations or production-like startup.

Demo credentials seeded on boot:

- username: `admin`
- password: `admin1234`

Run workspace commands:

```bash
npm run dev:api
npm run dev:web-admin
npm run dev:miniapp
```

Notes:

- `dev:miniapp` now runs `taro build --type weapp --watch`
- the miniapp API base URL can be overridden with `TARO_APP_API_BASE_URL`
- the web admin API base URL can be overridden with `VITE_API_BASE_URL`

## Build And Verification

Build all implemented workspaces:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Run the current test suite:

```bash
npm run test
```

Run the web admin Chromium smoke test:

```bash
npm run smoke:web-admin
```

## PostgreSQL Validation

To run the API against PostgreSQL, point `services/api/.env` to a database that the current role can access.

If the role cannot create databases, use an existing database and set:

```bash
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_existing_database
DB_SYNCHRONIZE=false
```

Then execute:

```bash
npm run migration:run --workspace=api
npm run dev:api
```

## Current Scope

The active MVP focuses on:

- authentication and role control
- store, user, ingredient, and dish management
- dish costing
- admin maintenance flows
- miniapp login, menu, detail, and my-page flows

## References

- `docs/fastfood-kitchen-api.postman_collection.json`
- `docs/local-delivery-runbook.md`
- `docs/test-execution-record-template-2026-04-08.md`
- `docs/multi-end-acceptance-brief-2026-04-08-v2.md`
- `docs/multi-end-regression-checklist-2026-04-08-v2.md`
- `docs/production-deployment.md`
- `docs/rectification-checklist-2026-04-08.md`

