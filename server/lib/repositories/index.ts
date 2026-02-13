import { getDb } from "../../db"
import { AttendanceRepository, BreakRepository, WorkSessionRepository } from "./attendance"
import { DailyReportRepository } from "./daily-report"
import { ProfileRepository } from "./profile"

export function createRepos(env: { DATABASE_URL: string }) {
  const db = getDb(env.DATABASE_URL)
  return {
    attendance: new AttendanceRepository(db),
    workSession: new WorkSessionRepository(db),
    break: new BreakRepository(db),
    dailyReport: new DailyReportRepository(db),
    profile: new ProfileRepository(db),
  }
}

export { DatabaseError } from "./attendance"
