// lib/swr-keys.ts
// SWRキャッシュキーの定数定義（Single Source of Truth）

export const SWR_KEYS = {
  // ダッシュボード
  ATTENDANCE_TODAY: "attendance-today",
  ATTENDANCE_WEEK_TOTAL: "attendance-week-total",
  PLANNED_TASKS_TODAY: "planned-tasks-today",

  // 勤怠履歴
  attendanceMonth: (yearMonth: string) => ["attendance-month", yearMonth] as const,

  // 管理者 - 月次勤怠
  monthlyAttendance: (userId: string, year: number, month: number) =>
    ["monthlyAttendance", userId, year, month] as const,
  // ユーザー選択
  REPORT_USERS: "report-users",
  adminUsers: (excludeAdmin: boolean) => ["admin-users", excludeAdmin] as const,

  // 日報
  monthlyReports: (userId: string, yearMonth: string) =>
    ["monthly-reports", userId, yearMonth] as const,
  reportDetail: (reportId: string) => ["report-detail", reportId] as const,
  reportsByDate: (date?: string) => ["reports-by-date", date ?? "today"] as const,
} as const
