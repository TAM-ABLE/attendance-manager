"use client"

import { FileText, RefreshCw } from "lucide-react"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { ReportDetailDialog } from "@/components/ReportDetailDialog"
import { Button } from "@/components/ui/button"
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

  const {
    data: todayReports = [],
    isValidating: isValidatingToday,
    mutate: mutateToday,
  } = useSWR(SWR_KEYS.reportsByDate(), () => fetchReportsByDate(), {
    fallbackData: initialReports,
    refreshInterval: 60_000,
  })

  const {
    data: yesterdayReports = [],
    isValidating: isValidatingYesterday,
    mutate: mutateYesterday,
  } = useSWR(
    activeTab === "yesterday" ? SWR_KEYS.reportsByDate(yesterday) : null,
    () => fetchReportsByDate(yesterday),
    { refreshInterval: 60_000 },
  )

  const isLoading = activeTab === "today" ? isValidatingToday : isValidatingYesterday

  const handleViewDetail = (reportId: string) => {
    setSelectedReportId(reportId)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedReportId(null)
  }

  const handleRefresh = () => {
    if (activeTab === "today") {
      mutateToday()
    } else {
      mutateYesterday()
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                日報一覧
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">提出された日報を確認</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">更新</span>
            </Button>
          </div>
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
