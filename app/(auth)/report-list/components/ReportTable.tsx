"use client"

import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatReportDate, getStatusDisplay } from "@/lib/report-format"
import type { DailyReportListItem } from "@/types/DailyReport"

interface ReportTableProps {
  reports: DailyReportListItem[]
  isLoading: boolean
  onViewDetail: (reportId: string) => void
}

function formatSubmittedAt(timestamp: number | null): string {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ReportTable({ reports, isLoading, onViewDetail }: ReportTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">この月の日報はありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">日報履歴</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 sm:w-32">日付</TableHead>
                <TableHead className="w-20 sm:w-24">ステータス</TableHead>
                <TableHead className="w-24 sm:w-32 hidden sm:table-cell">提出日時</TableHead>
                <TableHead className="w-16 sm:w-20 text-center">予定</TableHead>
                <TableHead className="w-16 sm:w-20 text-center">実績</TableHead>
                <TableHead className="w-16 sm:w-20 text-center">詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const status = getStatusDisplay(report.submittedAt)
                return (
                  <TableRow
                    key={report.id}
                    className={
                      report.hasIssues
                        ? "bg-[oklch(0.704_0.191_22.216/0.15)] hover:bg-[oklch(0.704_0.191_22.216/0.25)]"
                        : ""
                    }
                  >
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {formatReportDate(report.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                      {formatSubmittedAt(report.submittedAt)}
                    </TableCell>
                    <TableCell className="text-center text-xs sm:text-sm">
                      {report.plannedTaskCount}件
                    </TableCell>
                    <TableCell className="text-center text-xs sm:text-sm">
                      {report.actualTaskCount}件
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => onViewDetail(report.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
