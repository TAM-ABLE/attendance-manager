import { calculateSessionsTotals } from "@/lib/calculation"
import type { WorkSession } from "@/types/Attendance"

export type DbAttendanceRecord = {
  id: string
  date: string
  workSessions: Array<{
    id: string
    clockIn: string
    clockOut: string | null
    breaks: Array<{
      id: string
      breakStart: string
      breakEnd: string | null
    }>
  }>
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

type DbWorkSession = DbAttendanceRecord["workSessions"][number]

export function formatWorkSessions(workSessions: DbWorkSession[]): WorkSession[] {
  return workSessions.map((s) => ({
    id: s.id,
    clockIn: s.clockIn ? new Date(s.clockIn).getTime() : null,
    clockOut: s.clockOut ? new Date(s.clockOut).getTime() : null,
    breaks: s.breaks.map((b) => ({
      id: b.id,
      start: b.breakStart ? new Date(b.breakStart).getTime() : null,
      end: b.breakEnd ? new Date(b.breakEnd).getTime() : null,
    })),
  }))
}

export function formatAttendanceRecord(record: DbAttendanceRecord): FormattedAttendanceRecord {
  const sessions = formatWorkSessions(record.workSessions)
  const { workTotalMs, breakTotalMs } = calculateSessionsTotals(sessions)

  return {
    date: record.date,
    sessions,
    workTotalMs,
    breakTotalMs,
  }
}
