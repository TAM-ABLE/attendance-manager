import { apiClient } from "@/lib/api-client"
import { formatYearMonth } from "@/lib/time"
import type { AttendanceRecord, User, WorkSession } from "@/types/Attendance"

export function getUsers() {
  return apiClient<User[]>("/admin/users")
}

export function getUserMonthlyAttendance(userId: string, year: number, month: number) {
  // month は 0-indexed (Date.getMonth() から) なので +1 して YYYY-MM 形式に変換
  const actualMonth = month + 1
  const yearMonth = formatYearMonth(year, actualMonth)
  return apiClient<AttendanceRecord[]>(`/admin/users/${userId}/attendance/month/${yearMonth}`)
}

export function getUserDateSessions(userId: string, date: string) {
  return apiClient<WorkSession[]>(`/admin/users/${userId}/attendance/${date}/sessions`)
}

export function updateUserDateSessions(userId: string, date: string, sessions: WorkSession[]) {
  return apiClient<null>(`/admin/users/${userId}/attendance/${date}/sessions`, {
    method: "PUT",
    body: { sessions },
  })
}
