import { calculateSessionsTotals } from "@/lib/calculation"
import { TASK_TYPE_ACTUAL, TASK_TYPE_PLANNED } from "@/lib/constants"
import type { WorkSession } from "@/types/Attendance"
import type { DailyReportListItem } from "@/types/DailyReport"

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

function formatWorkSessions(workSessions: DbWorkSession[]): WorkSession[] {
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

export function getFormattedSessions(record: DbAttendanceRecord | null): WorkSession[] {
  if (!record?.workSessions || !Array.isArray(record.workSessions)) {
    return []
  }
  return formatWorkSessions(record.workSessions)
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

export function toReportListItem(
  report: {
    id: string
    userId: string
    date: string
    issues: string | null
    submittedAt: string | null
    tasks: { taskType: string }[]
  },
  user: { name: string; employeeNumber: string },
): DailyReportListItem {
  const tasks = report.tasks || []
  return {
    id: report.id,
    userId: report.userId,
    userName: user.name,
    employeeNumber: user.employeeNumber,
    date: report.date,
    submittedAt: report.submittedAt ? new Date(report.submittedAt).getTime() : null,
    plannedTaskCount: tasks.filter((t) => t.taskType === TASK_TYPE_PLANNED).length,
    actualTaskCount: tasks.filter((t) => t.taskType === TASK_TYPE_ACTUAL).length,
    hasIssues: report.issues != null && report.issues.trim() !== "",
  }
}
