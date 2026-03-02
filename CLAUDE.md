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
- `hooks/` - Shared custom React hooks (usePasswordStrength, useUserSelect, useDialogState, useMonthNavigation, useAsyncAction, useEditDialogBase)
- `lib/` - Utilities (client-side + domain logic: schemas, time, calculation, constants, swr-keys, task-form, exportCsv, report-format, utils)
- `types/` - TypeScript type definitions (Attendance, DailyReport, ApiResponse)
- `server/` - Hono API (routes, middleware, repositories)
- `supabase/` - Supabase config, migrations, seed data, email templates

### Integrated API (Hono on Next.js API Routes)
- Entry: `server/app.ts` - Hono app with `.basePath("/api")`
- Catch-all: `app/api/[...route]/route.ts` - mounts Hono via `hono/vercel`
- Routes (all under `/api`):
  - `/api/auth` - Authentication (login, logout, me, set-password)
  - `/api/admin/users/{userId}/resend-invite` - Resend invite email
  - `/api/admin/users/{userId}/password-reset` - Send password reset email
  - `/api/attendance` - Attendance CRUD (clock-in/out, breaks, queries, close-month)
  - `/api/admin` - Admin operations (user management, attendance editing)
  - `/api/daily-reports` - Daily report management (including admin by-date view)
- Database: Drizzle ORM + postgres.js (direct TCP connection to PostgreSQL, connection pool: max 10, idle timeout 20s)
- Auth: JWT verification via jose (HS256, local, no HTTP roundtrip) + GoTrue REST API via fetch (login, invite, password update, recovery)
- Auth middleware reads token from Authorization header or Cookie fallback
- OpenAPI: `@hono/zod-openapi` for schema validation + API docs
- Swagger UI: `/api/ui` (dev only, dynamic import), OpenAPI spec: `/api/doc` (dev only)
- Environment variables: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`, `SLACK_CSV_CHANNEL_ID`, `SLACK_ICON_CLOCK_IN`, `SLACK_ICON_CLOCK_OUT`, `SLACK_ICON_ATTENDANCE_CLOSE`

#### Server Code Structure
```
server/
├── app.ts                    ← Hono app with basePath("/api")
├── middleware/auth.ts         ← JWT auth + cookie fallback
├── routes/
│   ├── auth/{index,login,logout,me,set-password,constants}.ts
│   ├── attendance/{index,clock,queries,breaks,sessions,close-month}.ts
│   ├── admin/{index,users}.ts
│   └── daily-reports.ts
├── db/
│   ├── schema.ts                 ← Drizzle table + relation definitions
│   └── index.ts                  ← DB client singleton (postgres.js + drizzle, connection pool)
├── lib/
│   ├── auth-helpers.ts           ← jose JWT verification (HS256) + GoTrue REST API helpers (login, invite, update, listUsers, recovery) + extractBearerToken
│   ├── errors.ts, formatters.ts (getFormattedSessions, formatAttendanceRecord), openapi-hono.ts
│   ├── openapi-schemas.ts, openapi-responses.ts, sessions.ts
│   ├── slack.ts                     ← Clock-in/out Slack notifications
│   ├── swagger.ts                     ← OpenAPI doc + Swagger UI registration (dev only)
│   ├── slack-csv.ts                 ← Slack v2 file upload (monthly CSV)
│   ├── csv.ts                       ← Monthly attendance CSV generation
│   └── repositories/{index,errors,attendance,profile,daily-report}.ts
└── types/env.ts
```

#### OpenAPI + Zod Architecture
- `server/lib/openapi-schemas.ts` - Zod schema definitions with OpenAPI metadata
- `server/lib/openapi-responses.ts` - Shared OpenAPI response objects (validationErrorResponse, serverErrorResponse, etc.)
- `server/lib/openapi-hono.ts` - OpenAPIHono factory with unified error handling
- Routes use `createRoute()` + `router.openapi()` pattern for type-safe handlers

### Frontend (Next.js App Router)
- Uses `app/` directory structure
- Auth: Server Components + HttpOnly Cookie (Route Groups for access control)
- State: SWR for data fetching with SSC initial data, global config via `SWRProvider` (`revalidateOnFocus: false`, `dedupingInterval: 5000`)
- UI: Tailwind CSS 4 + shadcn/ui components (Radix UI based)
- Path alias: `@/*` maps to root

#### Slack Integration
See `docs/slack-setup-guide.md` for setup details.

- Clock-in/out notifications to Slack (threaded messages, fire-and-forget async)
- Monthly attendance CSV upload to Slack via v2 file upload API
- Server libs: `server/lib/slack.ts`, `server/lib/slack-csv.ts`, `server/lib/csv.ts`

#### Email Invitation & Recovery
See `docs/email-setup-guide.md` for setup details.

- Admin creates user → Supabase sends invite email via GoTrue `/invite` endpoint
- User clicks link → redirected to `/set-password` with access token in URL hash
- Token verified server-side → password set → auto-login
- Admin can resend invite (for pending users) or send password reset (for active users)
- Password reset uses GoTrue `/recover` endpoint → recovery email → `/set-password` with `type=recovery`
- Email templates: `supabase/templates/invite.html`, `supabase/templates/recovery.html`
- Rate limit: 2 emails/hour (built-in SMTP), configurable with custom SMTP

#### Performance Optimizations
See `docs/performance.md` for details.

- Bundle size: framer-motion removed (CSS animate-spin), Swagger UI dev-only dynamic import
- Network: Cache-Control on monthly endpoints, Slack notifications fire-and-forget
- Database: performance indexes, SQL-level weekly aggregation, upsert for findOrCreateRecord, connection pool config
- Rendering: React.memo on dashboard components, SWR global config via SWRProvider

#### Data Fetching Architecture
See `docs/data-fetching-architecture.md` for details.

- **Initial load (SSC)**: Server Components fetch data via `fetchWithAuth()` → `app.fetch()` (no network roundtrip)
- **Client updates (SWR)**: After user actions, SWR `mutate()` refetches via `/api/*` → Hono API
- **No loading on initial render**: `fallbackData` in SWR prevents loading spinners
- **SWR global config**: `SWRProvider` in auth layout sets `revalidateOnFocus: false` and `dedupingInterval: 5000`
- **Auto-polling**: Admin today reports view uses `refreshInterval: 60_000` (60s) for automatic updates
- **Cache-Control**: Monthly attendance and daily reports endpoints return `Cache-Control: private, max-age=60`

#### Authentication Architecture
See `docs/authentication.md` for details.

- `lib/auth/server.ts` - Server Component auth utilities (`getUser`, `requireAuth`, `requireUser`, `requireAdmin`, `fetchWithAuth`) using `app.fetch()` for direct Hono invocation
- `lib/auth/with-retry.ts` - Client-side 401 error handling (redirect to login)
- `lib/api-client.ts` - Client-side API client via `/api/*` (Cookie sent automatically by browser)
- `lib/api-services/` - Domain-specific API service modules (admin, attendance, daily-reports)
- Email invitation flow: new users receive an invite email and set their password via a token-based link
  - Admin can resend invite emails for pending users or send password reset emails for active users
- Route Groups for access control:
  - `(public)/` - Public pages (login, set-password)
  - `(auth)/` - Authenticated pages (dashboard, edit-attendance, report-list)
  - `(auth)/(admin)/` - Admin-only pages (admin)

#### Key Pages
- `/dashboard` - Main employee view (clock-in/out, break management, session list)
- `/admin` - Admin view (user management, user registration, invite resend, password reset, attendance editing, CSV export, monthly close, today's reports)
- `/edit-attendance` - Edit attendance sessions for a specific date (with close-month button)
- `/report-list` - Daily reports list (all authenticated users)
- `/login` - Authentication page
- `/set-password` - Token-based password setup (from invite email link) or password reset (from recovery email link)

#### Component Organization
- `components/` - Shared components (Header, Footer, Loader, SuccessDialog, SWRProvider, TimeInput, DialogWrapper, EditAttendanceDialog, MonthNavigator, ReportDetailDialog)
- `components/ui/` - shadcn/ui base components (button, dialog, card, etc.)
- `app/(auth)/[page]/components/` - Page-specific components (e.g. TaskListInput, TaskChipSelector in dashboard)
- `app/(auth)/[page]/hooks/` - Page-specific custom hooks (e.g. useTaskList, useUserFormDialog)

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
