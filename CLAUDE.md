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
pnpm lint             # Run ESLint
pnpm tsc --noEmit     # Type check
pnpm cf-typegen       # Generate Cloudflare bindings types
```

### Frontend (Next.js 16 + React 19)
```bash
cd frontend
pnpm install          # Install dependencies
pnpm dev              # Start development server (localhost:3000)
pnpm build            # Production build
pnpm lint             # Run ESLint
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
- Auth: NextAuth.js with credentials provider (calls backend `/auth/login`)
- State: SWR for data fetching
- UI: Tailwind CSS 4 + shadcn/ui components (Radix UI based)
- Path alias: `@/*` maps to root

#### Key Pages
- `/dashboard` - Main employee view (clock-in/out, break management, session list)
- `/admin` - Admin view (user management, attendance editing, CSV export)
- `/attendance-history` - Historical attendance records
- `/login`, `/sign-up` - Authentication pages

#### Component Organization
- `components/` - Shared components (Header, Footer, Loader, SuccessDialog)
- `components/ui/` - shadcn/ui base components (button, dialog, card, etc.)
- `app/[page]/components/` - Page-specific components
- `app/[page]/hooks/` - Page-specific custom hooks

### Shared Types
`shared/types/Attendance.ts` defines core data models:
- `WorkSession` - Individual work session with clock-in/out and breaks
- `AttendanceRecord` - Daily attendance with multiple sessions
- `DayAttendance` - Formatted daily view with up to 3 sessions
- `Break` - Break start/end times
- `User` - User profile with employee ID

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to main/develop:
- Backend: lint + type check
- Frontend: lint + type check
- Uses pnpm as package manager
