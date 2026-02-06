// backend/lib/repositories/index.ts
// Repository ファクトリ

import { getSupabaseClient } from "../supabase"
import { AttendanceRepository, BreakRepository, WorkSessionRepository } from "./attendance"
import { DailyReportRepository } from "./daily-report"
import { ProfileRepository } from "./profile"

export function createRepos(env: {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  JWT_SECRET: string
}) {
  const supabase = getSupabaseClient(env)
  return {
    attendance: new AttendanceRepository(supabase),
    workSession: new WorkSessionRepository(supabase),
    break: new BreakRepository(supabase),
    dailyReport: new DailyReportRepository(supabase),
    profile: new ProfileRepository(supabase),
  }
}

export { DatabaseError } from "./attendance"
