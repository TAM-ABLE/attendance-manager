// app/(auth)/(admin)/admin/page.tsx

import { CalendarDays, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchWithAuth } from "@/lib/auth/server"
import type { User } from "@/types/Attendance"
import { MonthlyAttendanceView } from "./components/MonthlyAttendanceView"
import { UserManagementView } from "./components/UserManagementView"

export default async function AdminPage() {
  // 認証・権限チェックは(admin)/layout.tsxで実施済み

  // SSCでユーザー一覧を取得
  const users = await fetchWithAuth<User[]>("/admin/users")
  const regularUsers = users?.filter((u) => u.role !== "admin")

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">管理者ダッシュボード</h2>
          <p className="text-sm sm:text-base text-muted-foreground">チーム全体の勤怠・日報を管理</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
        <TabsList className="grid grid-cols-3 w-full sm:max-w-lg">
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            <Users className="h-4 w-4 mr-1 sm:mr-2" />
            ユーザー管理
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs sm:text-sm">
            <CalendarDays className="h-4 w-4 mr-1 sm:mr-2" />
            月別詳細
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

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">通知設定</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Slack通知やメール通知の設定（実装予定）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg">
                <div>
                  <p className="text-sm sm:text-base font-medium">週20時間超過アラート</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    メンバーの週間勤務時間が20時間を超えた時に通知
                  </p>
                </div>
                <Badge className="w-fit">有効</Badge>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg">
                <div>
                  <p className="text-sm sm:text-base font-medium">月次レポート自動送信</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    毎月1日に前月の集計レポートを自動送信
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                  無効
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
