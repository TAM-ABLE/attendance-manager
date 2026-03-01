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
- `hooks/` - Shared custom React hooks (usePasswordStrength, useUserSelect, useDialogState, useMonthNavigation)
- `lib/` - Utilities (client-side + domain logic: schemas, time, calculation, constants, swr-keys, task-form, exportCsv, utils)
- `types/` - TypeScript type definitions (Attendance, DailyReport, ApiResponse)
- `server/` - Hono API (routes, middleware, repositories)
- `supabase/` - Supabase config, migrations, seed data

### Integrated API (Hono on Next.js API Routes)
- Entry: `server/app.ts` - Hono app with `.basePath("/api")`
- Catch-all: `app/api/[...route]/route.ts` - mounts Hono via `hono/vercel`
- Routes (all under `/api`):
  - `/api/auth` - Authentication (login, logout, me, first-login)
  - `/api/attendance` - Attendance CRUD (clock-in/out, breaks, queries, close-month)
  - `/api/admin` - Admin operations (user management, attendance editing)
  - `/api/daily-reports` - Daily report management
- Database: Drizzle ORM + postgres.js (direct TCP connection to PostgreSQL)
- Auth: JWT verification via jose (local, no HTTP roundtrip) + GoTrue REST API via fetch (login, user creation, password update)
- Auth middleware reads token from Authorization header or Cookie fallback
- OpenAPI: `@hono/zod-openapi` for schema validation + API docs
- Swagger UI: `/api/ui` (dev), OpenAPI spec: `/api/doc`
- Environment variables: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`, `SLACK_CSV_CHANNEL_ID`, `SLACK_ICON_CLOCK_IN`, `SLACK_ICON_CLOCK_OUT`, `SLACK_ICON_ATTENDANCE_CLOSE`

#### Server Code Structure
```
server/
├── app.ts                    ← Hono app with basePath("/api")
├── middleware/auth.ts         ← JWT auth + cookie fallback
├── routes/
│   ├── auth/{index,login,logout,me,first-login,constants}.ts
│   ├── attendance/{index,clock,queries,breaks,sessions,close-month}.ts
│   ├── admin/{index,users}.ts
│   └── daily-reports.ts
├── db/
│   ├── schema.ts                 ← Drizzle table + relation definitions
│   └── index.ts                  ← DB client singleton (postgres.js + drizzle)
├── lib/
│   ├── auth-helpers.ts           ← jose JWT verification + GoTrue REST API helpers (login, create, update) + extractBearerToken
│   ├── errors.ts, formatters.ts (getFormattedSessions, formatAttendanceRecord), openapi-hono.ts
│   ├── openapi-schemas.ts, sessions.ts
│   ├── slack.ts                     ← Clock-in/out Slack notifications
│   ├── slack-csv.ts                 ← Slack v2 file upload (monthly CSV)
│   ├── csv.ts                       ← Monthly attendance CSV generation
│   └── repositories/{index,errors,attendance,profile,daily-report}.ts
└── types/env.ts
```

#### OpenAPI + Zod Architecture
- `server/lib/openapi-schemas.ts` - Zod schema definitions with OpenAPI metadata
- `server/lib/openapi-hono.ts` - OpenAPIHono factory with unified error handling
- Routes use `createRoute()` + `router.openapi()` pattern for type-safe handlers

### Frontend (Next.js App Router)
- Uses `app/` directory structure
- Auth: Server Components + HttpOnly Cookie (Route Groups for access control)
- State: SWR for data fetching with SSC initial data
- UI: Tailwind CSS 4 + shadcn/ui components (Radix UI based)
- Path alias: `@/*` maps to root

#### Slack Integration
See `docs/slack-setup-guide.md` for setup details.

- Clock-in/out notifications to Slack (threaded messages)
- Monthly attendance CSV upload to Slack via v2 file upload API
- Server libs: `server/lib/slack.ts`, `server/lib/slack-csv.ts`, `server/lib/csv.ts`

#### Data Fetching Architecture
See `docs/data-fetching-architecture.md` for details.

- **Initial load (SSC)**: Server Components fetch data via `fetchWithAuth()` → `app.fetch()` (no network roundtrip)
- **Client updates (SWR)**: After user actions, SWR `mutate()` refetches via `/api/*` → Hono API
- **No loading on initial render**: `fallbackData` in SWR prevents loading spinners

#### Authentication Architecture
See `docs/authentication.md` for details.

- `lib/auth/server.ts` - Server Component auth utilities (`getUser`, `requireAuth`, `requireUser`, `requireAdmin`, `fetchWithAuth`) using `app.fetch()` for direct Hono invocation
- `lib/auth/with-retry.ts` - Client-side 401 error handling (redirect to login)
- `lib/api-client.ts` - Client-side API client via `/api/*` (Cookie sent automatically by browser)
- `lib/api-services/` - Domain-specific API service modules (admin, attendance, daily-reports)
- First-login flow: new users must change their initial password before accessing the app
- Route Groups for access control:
  - `(public)/` - Public pages (login, first-login)
  - `(auth)/` - Authenticated pages (dashboard, attendance-history, edit-attendance, report-list)
  - `(auth)/(admin)/` - Admin-only pages (admin)

#### Key Pages
- `/dashboard` - Main employee view (clock-in/out, break management, session list)
- `/admin` - Admin view (user management, user registration, attendance editing, CSV export, monthly close)
- `/attendance-history` - Historical attendance records (calendar view)
- `/edit-attendance` - Edit attendance sessions for a specific date (with close-month button)
- `/report-list` - Daily reports list (all authenticated users)
- `/login` - Authentication page
- `/first-login` - First-time password change (required for new users)

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
- `lib/swr-keys.ts` - SWR cache key definitions (Single Source of Truth)
- `lib/task-form.ts` - Task form utilities (generateTaskId, createEmptyTask, toTasks)
- `lib/exportCsv.ts` - Client-side CSV export for admin
- `lib/utils.ts` - cn() utility for Tailwind CSS class merging

## Code Quality

### Linting & Formatting
- **Biome**: Primary linter and formatter (replaces ESLint + Prettier for most rules)
- **ESLint**: Next.js specific rules (`@next/next/*`)
- Config: `biome.json` at repository root

### CI/CD

GitHub Actions workflows (push/PR to main/develop):
- **CI** (`ci.yml`): Biome lint + ESLint (Next.js rules) + type check + build
- **CodeQL** (`codeql.yml`): Security analysis (push/PR to main + weekly schedule)
- **Migration Check** (`migration-check.yml`): Detects drift between Drizzle schema (`server/db/schema.ts`) and SQL migrations (`supabase/migrations/`). Triggered only when schema/migration files change
- **Bundle Size** (`bundle-size.yml`): Reports bundle size changes on PRs
- **Dependabot Lockfile Sync** (`dependabot-lockfile-sync.yml`): Auto-updates lockfile for Dependabot PRs
- **Auto Add to Project** (`auto-add-to-project.yml`): Automatically adds new issues to GitHub Project
- Uses pnpm as package manager

### Git Hooks (Lefthook)
- **pre-commit**: Biome lint on staged files
- **pre-push**: Block direct push to main + typecheck
