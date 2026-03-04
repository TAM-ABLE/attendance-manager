import { fetchWithAuth } from "@/lib/auth/server"
import type { User } from "@/types/Attendance"
import { MonthlyAttendanceView } from "./components/MonthlyAttendanceView"
import { MonthlyHelpPopover } from "./components/MonthlyHelpPopover"

export default async function MonthlyPage() {
  const users = await fetchWithAuth<User[]>("/admin/users")
  const regularUsers = users?.filter((u) => u.role !== "admin")

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold">月別詳細</h2>
        <MonthlyHelpPopover />
      </div>
      <MonthlyAttendanceView initialUsers={regularUsers ?? undefined} />
    </div>
  )
}
