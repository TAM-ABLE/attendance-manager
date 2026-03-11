import { apiClient } from "@/lib/api-client"
import { formatYearMonth } from "@/lib/time"
import type { AttendanceRecord, User, WorkSession } from "@/types/Attendance"

export function getUsers() {
  return apiClient<User[]>("/admin/users")
}

export function getUserMonthlyAttendance(userId: string, year: number, month: number) {
  const yearMonth = formatYearMonth(year, month)
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

export function updateUser(
  userId: string,
  data: { lastName?: string; firstName?: string; email?: string },
) {
  return apiClient<{
    id: string
    name: string
    email: string
    employeeNumber: string
    role: "admin" | "user"
  }>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: data,
  })
}

export function createUser(data: { lastName: string; firstName: string; email: string }) {
  return apiClient<{
    id: string
    name: string
    email: string
    employeeNumber: string
    role: "user"
  }>("/admin/users", {
    method: "POST",
    body: data,
  })
}

export function deleteUser(userId: string) {
  return apiClient<null>(`/admin/users/${userId}`, {
    method: "DELETE",
  })
}

export function resendInvite(userId: string) {
  return apiClient<{ message: string }>(`/admin/users/${userId}/resend-invite`, {
    method: "POST",
  })
}

export function resetPassword(userId: string) {
  return apiClient<{ message: string }>(`/admin/users/${userId}/password-reset`, {
    method: "POST",
  })
}
