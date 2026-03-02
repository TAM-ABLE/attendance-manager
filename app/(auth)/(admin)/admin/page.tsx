// app/(auth)/(admin)/admin/page.tsx

import { CalendarDays, FileText, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchWithAuth } from "@/lib/auth/server"
import type { User } from "@/types/Attendance"
import type { DailyReportListItem } from "@/types/DailyReport"
import { AdminHelpPopover } from "./components/AdminHelpPopover"
import { MonthlyAttendanceView } from "./components/MonthlyAttendanceView"
import { NotificationSettingsView } from "./components/NotificationSettingsView"
import { TodayReportsView } from "./components/TodayReportsView"
import { UserManagementView } from "./components/UserManagementView"

export default async function AdminPage() {
  // 認証・権限チェックは(admin)/layout.tsxで実施済み

  // SSCでユーザー一覧と本日の日報を取得
  const [users, todayReports] = await Promise.all([
    fetchWithAuth<User[]>("/admin/users"),
    fetchWithAuth<DailyReportListItem[]>("/daily-reports/by-date"),
  ])
  const regularUsers = users?.filter((u) => u.role !== "admin")

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">管理者ダッシュボード</h2>
          <p className="text-sm sm:text-base text-muted-foreground">チーム全体の勤怠・日報を管理</p>
        </div>
        <AdminHelpPopover />
      </div>

      <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
        <TabsList className="grid grid-cols-4 w-full sm:max-w-2xl">
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            <Users className="h-4 w-4 mr-1 sm:mr-2" />
            ユーザー管理
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs sm:text-sm">
            <CalendarDays className="h-4 w-4 mr-1 sm:mr-2" />
            月別詳細
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 sm:mr-2" />
            提出された日報
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            通知設定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagementView initialUsers={users ?? undefined} />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyAttendanceView initialUsers={regularUsers ?? undefined} />
        </TabsContent>

        <TabsContent value="reports">
          <TodayReportsView initialReports={todayReports ?? undefined} />
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettingsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
