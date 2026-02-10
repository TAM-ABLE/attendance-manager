import { apiClient } from "@/lib/api-client"
import type { DailyReport, DailyReportListItem, UserForSelect } from "@/types/DailyReport"

export interface UserMonthlyReportsResponse {
  user: UserForSelect | null
  yearMonth: string
  reports: DailyReportListItem[]
}

export function getDailyReportUsers() {
  return apiClient<UserForSelect[]>("/daily-reports/users")
}

export function getUserMonthlyReports(userId: string, yearMonth: string) {
  return apiClient<UserMonthlyReportsResponse>(`/daily-reports/user/${userId}/month/${yearMonth}`)
}

export function getDailyReportDetail(reportId: string) {
  return apiClient<DailyReport>(`/daily-reports/${reportId}`)
}
