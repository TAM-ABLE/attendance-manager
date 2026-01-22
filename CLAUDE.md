# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Attendance management and daily report system (勤怠管理・日報システム) - a web application for tracking employee clock-in/out times, breaks, and work sessions.

## Development Commands

### Backend (Cloudflare Workers + Hono)
```bash
cd backend
pnpm install          # Install dependencies
pnpm dev              # Start development server (wrangler dev)
pnpm deploy           # Deploy to Cloudflare Workers
pnpm lint             # Run Biome (lint + format check)
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format code with Biome
pnpm tsc --noEmit     # Type check
pnpm cf-typegen       # Generate Cloudflare bindings types
```

### Frontend (Next.js 16 + React 19)
```bash
cd frontend
pnpm install          # Install dependencies
pnpm dev              # Start development server (localhost:3000)
pnpm build            # Production build
pnpm lint             # Run Biome + ESLint (Next.js rules)
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format code with Biome
pnpm tsc --noEmit     # Type check
```

## Architecture

### Monorepo Structure
- `backend/` - Cloudflare Workers API with Hono framework
- `frontend/` - Next.js App Router application
- `shared/types/` - Shared TypeScript types between frontend and backend

### Backend (Hono API on Cloudflare Workers)
- Entry: `backend/src/index.ts` - Hono app with routes
- Routes:
  - `/auth` - Authentication (login, register)
  - `/database` - Attendance CRUD operations (clock-in, clock-out, breaks, work sessions)
  - `/slack` - Slack notifications for clock events
- Database: Supabase (via `@supabase/supabase-js`)
- Auth: JWT-based authentication
- Config: `wrangler.jsonc` for Cloudflare Workers settings
- Environment bindings defined in `backend/src/types/env.ts`

### Frontend (Next.js App Router)
- Uses `app/` directory structure
- Auth: Server Components + HttpOnly Cookie (Route Groups for access control)
- State: SWR for data fetching
- UI: Tailwind CSS 4 + shadcn/ui components (Radix UI based)
- Path alias: `@/*` maps to root

#### Authentication Architecture
- `lib/auth/server.ts` - Server Component auth utilities (`getUser`, `requireAuth`, `requireAdmin`)
- `lib/api-client.ts` - Client-side API client with `credentials: "include"` for Cookie auth
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

### Shared Types
`shared/types/Attendance.ts` defines core data models:
- `WorkSession` - Individual work session with clock-in/out and breaks
- `AttendanceRecord` - Daily attendance with multiple sessions
- `DayAttendance` - Formatted daily view with up to 3 sessions
- `Break` - Break start/end times
- `User` - User profile with employee ID

## Code Quality

### Linting & Formatting
- **Biome**: Primary linter and formatter (replaces ESLint + Prettier for most rules)
- **ESLint**: Frontend only - Next.js specific rules (`@next/next/*`)
- Config: `biome.json` at repository root

### CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to main/develop:
- Backend: Biome lint + type check
- Frontend: Biome lint + ESLint (Next.js rules) + type check
- Uses pnpm as package manager
