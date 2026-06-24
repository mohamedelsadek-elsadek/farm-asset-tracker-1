# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack poultry farm management system for "المصرية للإنتاج الحيواني" (Egyptian Animal Production Company). Tracks 6 farms, their houses/barns, and production cycles with financial analytics. The UI is RTL Arabic.

## Commands

```bash
# Typecheck all packages
pnpm run typecheck

# Build everything (typecheck + build all artifacts)
pnpm run build

# Regenerate API client hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes to PostgreSQL (dev only, requires DATABASE_URL)
pnpm --filter @workspace/db run push

# Run API server in dev mode
pnpm --filter @workspace/api-server run dev

# Run frontend in dev mode (requires PORT and BASE_PATH env vars)
pnpm --filter @workspace/poultry-app run dev

# Typecheck a single package
pnpm --filter @workspace/api-server run typecheck
```

## Architecture

This is a **pnpm workspace monorepo** with two categories of packages:

### `lib/` — Shared libraries
- **`@workspace/db`** (`lib/db/`) — Drizzle ORM schema definitions and DB connection. Tables: `farms`, `houses`, `cycles`, `mortality_logs`. Exports TypeScript types and Zod insert schemas via `drizzle-zod`. Requires `DATABASE_URL` env var at runtime.
- **`@workspace/api-spec`** (`lib/api-spec/`) — The OpenAPI contract (`openapi.yaml`). This is the **single source of truth** for the API surface. Edit here, then run `codegen` to regenerate downstream libs.
- **`@workspace/api-client-react`** (`lib/api-client-react/`) — Auto-generated React Query hooks (via Orval). Files under `src/generated/` are **never edited manually**. The custom fetch client (`src/custom-fetch.ts`) handles auth token injection and error typing.
- **`@workspace/api-zod`** (`lib/api-zod/`) — Auto-generated Zod validation schemas from the OpenAPI spec (via Orval). Files under `src/generated/` are **never edited manually**.

### `artifacts/` — Deployable applications
- **`@workspace/api-server`** (`artifacts/api-server/`) — Express 5 API server. Routes live under `src/routes/`, each route file maps to one resource. The server bundles to a single ESM file via esbuild (`build.mjs`). Uses `@workspace/db` for data access and `@workspace/api-zod` for request validation.
- **`@workspace/poultry-app`** (`artifacts/poultry-app/`) — React 19 + Vite frontend. Uses `@workspace/api-client-react` for all API calls. Routing via `wouter`. UI via shadcn/ui (Radix UI) + TailwindCSS v4 + Recharts for charts. Path alias `@/` maps to `src/`.

### Data flow
```
openapi.yaml
    ↓ (orval codegen)
api-client-react (React Query hooks)   api-zod (Zod schemas)
    ↓                                       ↓
poultry-app (frontend)               api-server (backend validation)
    ↓                                       ↓
                    lib/db (Drizzle ORM → PostgreSQL)
```

### Computed metrics
Cycle fields stored in DB are raw inputs (chickCount, totalFeedKg, feedCostTotal, etc.). The API server computes and returns derived metrics in responses — `mortalityRate`, `fcr` (feed conversion ratio), `averageWeightKg`, `totalCost`, `totalRevenue`, `netProfit`, `costPerLiveKg`, `profitPerChick` — these are **not persisted** in the DB.

## Key Conventions

### Modifying the API
1. Edit `lib/api-spec/openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Implement the route in `artifacts/api-server/src/routes/`
4. Use the generated React Query hook in the frontend

### TypeScript
- `tsconfig.base.json` at root defines shared compiler options (strict null checks, `noImplicitAny`, ES2022 target, `bundler` module resolution)
- Each package extends the base tsconfig
- `zod/v4` import path is used (not `zod` directly) for Zod v4 API

### Environment variables
- `DATABASE_URL` — required by `@workspace/db` and `@workspace/api-server`
- `PORT` — required by `@workspace/poultry-app` Vite dev server
- `BASE_PATH` — required by `@workspace/poultry-app` Vite dev server (sets the app's base URL path)

### Package manager
pnpm only — the root `package.json` preinstall script rejects npm/yarn. Shared dependency versions are defined in the `catalog:` section of `pnpm-workspace.yaml`; reference them with `catalog:` in individual `package.json` files rather than pinning versions locally. New packages must be at least 1 day old before pnpm allows installing them (supply-chain defense) — do not disable `minimumReleaseAge`.
