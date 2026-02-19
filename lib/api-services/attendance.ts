import { apiClient } from "@/lib/api-client"
import { formatYearMonth } from "@/lib/time"
import type { AttendanceRecord, Task, WorkSession } from "@/types/Attendance"

export function clockIn(userName: string, plannedTasks: Task[], clockInTime?: string) {
  return apiClient<{ slack_ts?: string }>("/attendance/clock-in", {
    method: "POST",
    body: { userName, plannedTasks, clockInTime },
  })
}

export function clockOut(
  userName: string,
  actualTasks: Task[],
  summary: string,
  issues: string,
  notes: string,
  clockOutTime?: string,
) {
  return apiClient<{ slack_ts?: string }>("/attendance/clock-out", {
    method: "POST",
    body: { userName, actualTasks, summary, issues, notes, clockOutTime },
  })
}

export function startBreak(breakStartTime?: string) {
  return apiClient<null>("/attendance/breaks/start", {
    method: "POST",
    body: { breakStartTime },
  })
}

export function endBreak(breakEndTime?: string) {
  return apiClient<null>("/attendance/breaks/end", {
    method: "POST",
    body: { breakEndTime },
  })
}

export function getToday() {
  return apiClient<AttendanceRecord | null>("/attendance/today")
}

export function getWeekTotal() {
  return apiClient<{ netWorkMs: number } | null>("/attendance/week/total")
}

export function getMonth(year: number, month: number) {
  const yearMonth = formatYearMonth(year, month)
  return apiClient<AttendanceRecord[]>(`/attendance/month/${yearMonth}`)
}

export function getDateSessions(date: string) {
  return apiClient<WorkSession[]>(`/attendance/${date}/sessions`)
}

export function updateDateSessions(date: string, sessions: WorkSession[]) {
  return apiClient<null>(`/attendance/${date}/sessions`, {
    method: "PUT",
    body: { sessions },
  })
}

export function closeMonth(yearMonth: string) {
  return apiClient<{ message: string }>(`/attendance/month/${yearMonth}/close`, {
    method: "POST",
  })
}
