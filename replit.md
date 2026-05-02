# المصرية للإنتاج الحيواني - Poultry Farm Management System

## Overview

Full-stack poultry farm management web application for "المصرية للإنتاج الحيواني" (Egyptian Animal Production Company). Manages 6 farms, their houses/barns, and production cycles with full financial analytics.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + Recharts

## Business Data

### 6 Farms:
1. المزرعة الجديدة — 3 houses × 1500m²
2. مزرعة 5&6 — 2 houses × 1500m²
3. مزرعة الكوثر — 3 houses (1×1750m² + 2×1500m²)
4. مزرعة الحاج عبد الباسط — 1 house × 1750m²
5. مزرعة الحاج وفيق — 2 houses × 750m²
6. مزرعة السيد حجاج — 1 house × 1750m²

### Per Cycle Data Entry:
Housing date, chick count, chick price, breed (Ross/Cobb/Other), feed consumption, feed cost, medication cost, daily mortality, final weight, sale age, sale price

### Auto-Calculated Metrics:
- Mortality rate (نسبة النفوق)
- FCR / Feed Conversion Ratio (معامل التحويل)
- Average weight (متوسط الوزن)
- Total cost, Revenue, Net profit
- Cost per live kg (تكلفة الكيلو الحي)
- Profit per chick (ربح الطائر)

## Application Pages

- `/` — Company Dashboard (KPIs, farm rankings, best cycles)
- `/farms` — All 6 farms with quick stats
- `/farms/:farmId` — Farm Dashboard (house comparison charts, cycle history)
- `/farms/:farmId/houses/:houseId` — House Detail (all cycles table)
- `/cycles/new` — New Cycle Form (cascading farm → house → data)
- `/cycles/:cycleId` — Cycle Detail (all metrics displayed)
- `/cycles/:cycleId/edit` — Edit Cycle Form

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

- `artifacts/poultry-app/` — React+Vite frontend (RTL Arabic UI)
- `artifacts/api-server/` — Express 5 API server
- `lib/api-spec/openapi.yaml` — OpenAPI contract
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — Drizzle ORM schema (farms, houses, cycles tables)
