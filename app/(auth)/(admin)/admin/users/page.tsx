import { fetchWithAuth } from "@/lib/auth/server"
import type { User } from "@/types/Attendance"
import { UserManagementView } from "./components/UserManagementView"
import { UsersHelpPopover } from "./components/UsersHelpPopover"

export default async function UsersPage() {
  const users = await fetchWithAuth<User[]>("/admin/users")

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">ユーザー管理</h2>
          <p className="text-muted-foreground text-sm">登録済みユーザーの管理</p>
        </div>
        <UsersHelpPopover />
      </div>
      <UserManagementView initialUsers={users ?? undefined} />
    </div>
  )
}
