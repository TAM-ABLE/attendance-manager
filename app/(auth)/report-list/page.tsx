// app/(auth)/report-list/page.tsx

import { fetchWithAuth } from "@/lib/auth/server"
import type { UserForSelect } from "@/types/DailyReport"
import { ReportListHelpPopover } from "./components/ReportListHelpPopover"
import { ReportListView } from "./components/ReportListView"

export default async function ReportListPage() {
  // 認証チェックは(auth)/layout.tsxで実施済み

  // SSCでユーザー一覧を取得
  const users = await fetchWithAuth<UserForSelect[]>("/daily-reports/users")

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold">日報履歴</h2>
        <ReportListHelpPopover />
      </div>
      <ReportListView initialUsers={users ?? undefined} />
    </div>
  )
}
