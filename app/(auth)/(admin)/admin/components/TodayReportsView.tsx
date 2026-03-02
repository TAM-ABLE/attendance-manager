"use client"

import { Eye, FileText, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getReportsByDate, getTodayReports } from "@/lib/api-services/daily-reports"
import { withRetry } from "@/lib/auth/with-retry"
import type { DailyReportListItem } from "@/types/DailyReport"
import { ReportDetailDialog } from "./ReportDetailDialog"

function formatSubmittedAt(timestamp: number | null): string {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  return date.toLocaleString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getYesterday(): string {
  const now = new Date()
  const jstOffset = 9 * 60 * 60 * 1000
  const jstDate = new Date(now.getTime() + jstOffset)
  jstDate.setDate(jstDate.getDate() - 1)
  return jstDate.toISOString().split("T")[0]
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${month}/${day}`
}

interface TodayReportsViewProps {
  initialReports?: DailyReportListItem[]
}

export function TodayReportsView({ initialReports }: TodayReportsViewProps) {
  const [todayReports, setTodayReports] = useState<DailyReportListItem[]>(initialReports ?? [])
  const [yesterdayReports, setYesterdayReports] = useState<DailyReportListItem[]>([])
  const [isLoadingToday, setIsLoadingToday] = useState(!initialReports)
  const [isLoadingYesterday, setIsLoadingYesterday] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"today" | "yesterday">("today")
  const [yesterdayLoaded, setYesterdayLoaded] = useState(false)

  const fetchTodayReports = useCallback(async () => {
    setIsLoadingToday(true)
    try {
      const result = await withRetry(() => getTodayReports())
      if (result.success) {
        setTodayReports(result.data)
      }
    } catch (err) {
      console.error("Failed to fetch today reports:", err)
    } finally {
      setIsLoadingToday(false)
    }
  }, [])

  const fetchYesterdayReports = useCallback(async () => {
    setIsLoadingYesterday(true)
    try {
      const yesterday = getYesterday()
      const result = await withRetry(() => getReportsByDate(yesterday))
      if (result.success) {
        setYesterdayReports(result.data)
      }
    } catch (err) {
      console.error("Failed to fetch yesterday reports:", err)
    } finally {
      setIsLoadingYesterday(false)
      setYesterdayLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!initialReports) {
      fetchTodayReports()
    }
  }, [initialReports, fetchTodayReports])

  useEffect(() => {
    if (activeTab === "yesterday" && !yesterdayLoaded) {
      fetchYesterdayReports()
    }
  }, [activeTab, yesterdayLoaded, fetchYesterdayReports])

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
      fetchTodayReports()
    } else {
      fetchYesterdayReports()
    }
  }

  const renderReportsTable = (reports: DailyReportListItem[], isLoading: boolean, emptyMessage: string) => {
    if (isLoading) {
      return <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
    }

    if (reports.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      )
    }

    return (
      <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 sm:w-24">社員番号</TableHead>
                <TableHead className="w-24 sm:w-32">名前</TableHead>
                <TableHead className="w-20 sm:w-24">提出時刻</TableHead>
                <TableHead className="w-16 sm:w-20 text-center">予定</TableHead>
                <TableHead className="w-16 sm:w-20 text-center">実績</TableHead>
                <TableHead className="w-16 sm:w-20 text-center">詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-xs sm:text-sm">
                    {report.employeeNumber}
                  </TableCell>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    {report.userName}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {formatSubmittedAt(report.submittedAt)}
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-sm">
                    {report.plannedTaskCount}件
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-sm">
                    {report.actualTaskCount}件
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(report.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 text-xs text-muted-foreground text-right">
          {reports.length}件の日報
        </div>
      </>
    )
  }

  const isLoading = activeTab === "today" ? isLoadingToday : isLoadingYesterday

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
              <CardDescription className="text-xs sm:text-sm">
                提出された日報を確認
              </CardDescription>
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
              <TabsTrigger value="today">本日</TabsTrigger>
              <TabsTrigger value="yesterday">前日 ({formatDate(getYesterday())})</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              {renderReportsTable(todayReports, isLoadingToday, "本日提出された日報はありません")}
            </TabsContent>
            <TabsContent value="yesterday">
              {renderReportsTable(yesterdayReports, isLoadingYesterday, "前日提出された日報はありません")}
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
