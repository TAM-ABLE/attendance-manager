// dashboard/page.tsx

import { fetchWithAuth, requireUser } from "@/lib/auth/server"
import type { AttendanceRecord } from "@/types/Attendance"
import { DashboardClient } from "./components/DashboardClient"

export default async function DashboardPage() {
  const user = await requireUser()

  // SSCで初期データを並列取得
  const [attendance, weekData] = await Promise.all([
    fetchWithAuth<AttendanceRecord | null>("/attendance/today"),
    fetchWithAuth<{ netWorkMs: number } | null>("/attendance/week/total"),
  ])

  const initialData = {
    attendance: attendance ?? null,
    weekTotalMs: weekData?.netWorkMs ?? 0,
  }

  return <DashboardClient user={user} initialData={initialData} />
}
