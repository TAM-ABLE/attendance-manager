import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DailyReportListItem } from "@/types/DailyReport"

function formatSubmittedAt(timestamp: number | null): string {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  return date.toLocaleString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

type ReportsTableProps = {
  reports: DailyReportListItem[]
  isLoading: boolean
  emptyMessage: string
  onViewDetail: (reportId: string) => void
}

export function ReportsTable({
  reports,
  isLoading,
  emptyMessage,
  onViewDetail,
}: ReportsTableProps) {
  if (isLoading && reports.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
  }

  if (reports.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">{emptyMessage}</div>
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
                <TableCell className="font-medium text-xs sm:text-sm">{report.userName}</TableCell>
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
                  <Button variant="ghost" size="sm" onClick={() => onViewDetail(report.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-3 text-xs text-muted-foreground text-right">{reports.length}件の日報</div>
    </>
  )
}
