import { fetchWithAuth, requireAuth } from "@/lib/auth/server"
import { formatYearMonthFromDate } from "@/lib/time"
import type { AttendanceRecord } from "@/types/Attendance"
import { EditAttendanceClient } from "./components/EditAttendanceClient"

export default async function EditAttendancePage() {
  const authUser = await requireAuth()

  const now = new Date()
  const yearMonth = formatYearMonthFromDate(now)

  const attendanceData = await fetchWithAuth<AttendanceRecord[]>(`/attendance/month/${yearMonth}`)

  const user = {
    name: authUser.name,
    email: authUser.email,
  }

  const initialData = attendanceData ? { attendanceData, yearMonth } : undefined

  return <EditAttendanceClient user={user} initialData={initialData} />
}
