// lib/swr-keys.ts
// SWRキャッシュキーの定数定義（Single Source of Truth）

export const SWR_KEYS = {
  // ダッシュボード
  ATTENDANCE_TODAY: "attendance-today",
  ATTENDANCE_WEEK_TOTAL: "attendance-week-total",

  // 勤怠履歴
  attendanceMonth: (yearMonth: string) => ["attendance-month", yearMonth] as const,

  // 管理者 - 月次勤怠
  monthlyAttendance: (userId: string, year: number, month: number) =>
    ["monthlyAttendance", userId, year, month] as const,
} as const
