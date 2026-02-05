// app/(auth)/attendance-history/page.tsx

import { fetchWithAuth } from "@/lib/auth/server"
import { formatYearMonthFromDate } from "@attendance-manager/shared/lib/time"
import type { AttendanceRecord } from "@attendance-manager/shared/types/Attendance"
import { AttendanceHistoryClient } from "./components/AttendanceHistoryClient"

export default async function AttendanceHistoryPage() {
  // 認証チェックは(auth)/layout.tsxで実施済み

  // 今月のyearMonthを計算
  const now = new Date()
  const yearMonth = formatYearMonthFromDate(now)

  // SSCで今月の勤怠データを取得
  const attendanceData = await fetchWithAuth<AttendanceRecord[]>(`/attendance/month/${yearMonth}`)

  const initialData = attendanceData
    ? {
        attendanceData,
        yearMonth,
      }
    : undefined

  return <AttendanceHistoryClient initialData={initialData} />
}
