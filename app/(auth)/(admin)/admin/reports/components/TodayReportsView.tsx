"use client"

import { FileText } from "lucide-react"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { ReportDetailDialog } from "@/components/ReportDetailDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getReportsByDate } from "@/lib/api-services/daily-reports"
import { withRetry } from "@/lib/auth/with-retry"
import { SWR_KEYS } from "@/lib/swr-keys"
import { yesterdayJSTString } from "@/lib/time"
import type { DailyReportListItem } from "@/types/DailyReport"
import { ReportsTable } from "./ReportsTable"

function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split("-")
  return `${month}/${day}`
}

async function fetchReportsByDate(date?: string): Promise<DailyReportListItem[]> {
  const result = await withRetry(() => getReportsByDate(date))
  if (result.success) return result.data
  return []
}

interface TodayReportsViewProps {
  initialReports?: DailyReportListItem[]
}

export function TodayReportsView({ initialReports }: TodayReportsViewProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"today" | "yesterday">("today")

  const yesterday = useMemo(() => yesterdayJSTString(), [])

  const { data: todayReports = [], isValidating: isValidatingToday } = useSWR(
    SWR_KEYS.reportsByDate(),
    () => fetchReportsByDate(),
    {
      fallbackData: initialReports,
      refreshInterval: 60_000,
    },
  )

  const { data: yesterdayReports = [], isValidating: isValidatingYesterday } = useSWR(
    activeTab === "yesterday" ? SWR_KEYS.reportsByDate(yesterday) : null,
    () => fetchReportsByDate(yesterday),
    { refreshInterval: 60_000 },
  )

  const handleViewDetail = (reportId: string) => {
    setSelectedReportId(reportId)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedReportId(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            日報提出状況
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            本日・前日の提出状況を確認
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "today" | "yesterday")}>
            <TabsList className="mb-4">
              <TabsTrigger value="yesterday">前日 ({formatDateShort(yesterday)})</TabsTrigger>
              <TabsTrigger value="today">本日</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <ReportsTable
                reports={todayReports}
                isLoading={isValidatingToday}
                emptyMessage="本日提出された日報はありません"
                onViewDetail={handleViewDetail}
              />
            </TabsContent>
            <TabsContent value="yesterday">
              <ReportsTable
                reports={yesterdayReports}
                isLoading={isValidatingYesterday}
                emptyMessage="前日提出された日報はありません"
                onViewDetail={handleViewDetail}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ReportDetailDialog
        open={isDetailOpen}
        reportId={selectedReportId}
        onClose={handleCloseDetail}
      />
    </>
  )
}
