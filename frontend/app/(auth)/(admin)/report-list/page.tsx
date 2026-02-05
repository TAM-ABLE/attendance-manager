// app/(auth)/(admin)/report-list/page.tsx

import { fetchWithAuth } from "@/lib/auth/server"
import type { UserForSelect } from "@attendance-manager/shared/types/DailyReport"
import { FileText } from "lucide-react"
import { ReportListView } from "./components/ReportListView"

export default async function ReportListPage() {
  // 認証・権限チェックは(admin)/layout.tsxで実施済み

  // SSCでユーザー一覧を取得
  const users = await fetchWithAuth<UserForSelect[]>("/daily-reports/users")

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">日報一覧</h2>
          <p className="text-sm sm:text-base text-muted-foreground">メンバーの日報を確認</p>
        </div>
      </div>

      <ReportListView initialUsers={users ?? undefined} />
    </div>
  )
}
