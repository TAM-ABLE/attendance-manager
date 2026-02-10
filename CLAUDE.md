# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Attendance management and daily report system (勤怠管理・日報システム) - a web application for tracking employee clock-in/out times, breaks, and work sessions.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server (localhost:3000)
pnpm build            # Production build
pnpm lint             # Run Biome + ESLint (Next.js rules)
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format code with Biome
pnpm tsc --noEmit     # Type check
```

## Architecture

### Project Structure
- `app/` - Next.js App Router pages
- `components/` - React components (shared + ui)
- `hooks/` - Custom React hooks
- `lib/` - Utilities (client-side + domain logic: schemas, time, calculation, constants)
- `types/` - TypeScript type definitions (Attendance, DailyReport, ApiResponse)
- `server/` - Hono API (routes, middleware, repositories)
- `supabase/` - Supabase config, migrations, seed data

### Integrated API (Hono on Next.js API Routes)
- Entry: `server/app.ts` - Hono app with `.basePath("/api")`
- Catch-all: `app/api/[...route]/route.ts` - mounts Hono via `hono/vercel`
- Routes (all under `/api`):
  - `/api/auth` - Authentication (login, register, logout, me)
  - `/api/attendance` - Attendance CRUD (clock-in/out, breaks, queries)
  - `/api/admin` - Admin operations (user management, attendance editing)
  - `/api/daily-reports` - Daily report management
- Database: Supabase (via `@supabase/supabase-js`)
- Auth: JWT via Supabase + HttpOnly Cookie (set by Hono login/register routes)
- Auth middleware reads token from Authorization header or Cookie fallback
- OpenAPI: `@hono/zod-openapi` for schema validation + API docs
- Swagger UI: `/api/ui` (dev), OpenAPI spec: `/api/doc`
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`

#### Server Code Structure
```
server/
├── app.ts                    ← Hono app with basePath("/api")
├── middleware/auth.ts         ← JWT auth + cookie fallback
├── routes/
│   ├── auth/{index,login,register,logout,me}.ts
│   ├── attendance/{index,clock,queries,breaks}.ts
│   ├── admin/{index,users}.ts
│   └── daily-reports.ts
├── lib/
│   ├── errors.ts, formatters.ts, openapi-hono.ts
│   ├── openapi-schemas.ts, slack.ts, supabase.ts
│   └── repositories/{index,attendance,profile,daily-report}.ts
└── types/{env.ts, supabase.ts}
```

#### OpenAPI + Zod Architecture
See `docs/openapi-zod.md` for details.

- `server/lib/openapi-schemas.ts` - Zod schema definitions with OpenAPI metadata
- `server/lib/openapi-hono.ts` - OpenAPIHono factory with unified error handling
- Routes use `createRoute()` + `router.openapi()` pattern for type-safe handlers

### Frontend (Next.js App Router)
- Uses `app/` directory structure
- Auth: Server Components + HttpOnly Cookie (Route Groups for access control)
- State: SWR for data fetching with SSC initial data
- UI: Tailwind CSS 4 + shadcn/ui components (Radix UI based)
- Path alias: `@/*` maps to root

#### Data Fetching Architecture
See `docs/data-fetching-architecture.md` for details.

- **Initial load (SSC)**: Server Components fetch data via `fetchWithAuth()` → `app.fetch()` (no network roundtrip)
- **Client updates (SWR)**: After user actions, SWR `mutate()` refetches via `/api/*` → Hono API
- **No loading on initial render**: `fallbackData` in SWR prevents loading spinners

#### Authentication Architecture
See `docs/authentication.md` for details.

- `lib/auth/server.ts` - Server Component auth utilities (`getUser`, `requireAuth`, `requireAdmin`, `fetchWithAuth`) using `app.fetch()` for direct Hono invocation
- `lib/api-client.ts` - Client-side API client via `/api/*` (Cookie sent automatically by browser)
- Route Groups for access control:
  - `(public)/` - Public pages (login, sign-up)
  - `(auth)/` - Authenticated pages (dashboard, attendance-history)
  - `(auth)/(admin)/` - Admin-only pages (admin, report-list)

#### Key Pages
- `/dashboard` - Main employee view (clock-in/out, break management, session list)
- `/admin` - Admin view (user management, attendance editing, CSV export)
- `/attendance-history` - Historical attendance records
- `/report-list` - Daily reports list (admin only)
- `/login`, `/sign-up` - Authentication pages

#### Component Organization
- `components/` - Shared components (Header, Footer, Loader, SuccessDialog)
- `components/ui/` - shadcn/ui base components (button, dialog, card, etc.)
- `app/(auth)/[page]/components/` - Page-specific components
- `app/(auth)/[page]/hooks/` - Page-specific custom hooks

### Types & Domain Logic
- `types/Attendance.ts` - Core data models (WorkSession, AttendanceRecord, DayAttendance, Break, User)
- `types/DailyReport.ts` - Daily report types
- `types/ApiResponse.ts` - API response types
- `lib/schemas.ts` - Zod schemas (Single Source of Truth for types)
- `lib/time.ts` - Time formatting and calculation utilities
- `lib/calculation.ts` - Working hours calculation
- `lib/constants.ts` - Application constants

## Code Quality

### Linting & Formatting
- **Biome**: Primary linter and formatter (replaces ESLint + Prettier for most rules)
- **ESLint**: Next.js specific rules (`@next/next/*`)
- Config: `biome.json` at repository root

### CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to main/develop:
- Biome lint + ESLint (Next.js rules) + type check + build
- Uses pnpm as package manager
