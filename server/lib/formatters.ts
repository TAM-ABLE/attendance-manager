import { calculateSessionsTotals } from "@/lib/calculation"
import type { WorkSession } from "@/types/Attendance"
import type { Database } from "../types/supabase"

export type DbAttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"] & {
  work_sessions: Array<
    Database["public"]["Tables"]["work_sessions"]["Row"] & {
      breaks: Database["public"]["Tables"]["breaks"]["Row"][]
    }
  >
}

export interface FormattedAttendanceRecord {
  date: string
  sessions: {
    id: string
    clockIn: number | null
    clockOut: number | null
    breaks: {
      id: string
      start: number | null
      end: number | null
    }[]
  }[]
  workTotalMs: number
  breakTotalMs: number
}

type DbWorkSession = DbAttendanceRecord["work_sessions"][number]

export function formatWorkSessions(workSessions: DbWorkSession[]): WorkSession[] {
  return workSessions.map((s) => ({
    id: s.id,
    clockIn: s.clock_in ? new Date(s.clock_in).getTime() : null,
    clockOut: s.clock_out ? new Date(s.clock_out).getTime() : null,
    breaks: s.breaks.map((b) => ({
      id: b.id,
      start: b.break_start ? new Date(b.break_start).getTime() : null,
      end: b.break_end ? new Date(b.break_end).getTime() : null,
    })),
  }))
}

export function formatAttendanceRecord(record: DbAttendanceRecord): FormattedAttendanceRecord {
  const sessions = formatWorkSessions(record.work_sessions)
  const { workTotalMs, breakTotalMs } = calculateSessionsTotals(sessions)

  return {
    date: record.date,
    sessions,
    workTotalMs,
    breakTotalMs,
  }
}
