import { fetchWithAuth } from "@/lib/auth/server"
import type { DailyReportListItem } from "@/types/DailyReport"
import { ReportsHelpPopover } from "./components/ReportsHelpPopover"
import { TodayReportsView } from "./components/TodayReportsView"

export default async function ReportsPage() {
  const todayReports = await fetchWithAuth<DailyReportListItem[]>("/daily-reports/by-date")

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">日報提出状況</h2>
          <p className="text-muted-foreground text-sm">本日・前日の提出状況を確認</p>
        </div>
        <ReportsHelpPopover />
      </div>
      <TodayReportsView initialReports={todayReports ?? undefined} />
    </div>
  )
}
