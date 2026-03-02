"use client"

import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getDailyReportDetail } from "@/lib/api-services/daily-reports"
import { withRetryFetcher } from "@/lib/auth/with-retry"
import { formatReportDateLong, getStatusDisplay } from "@/lib/report-format"
import { SWR_KEYS } from "@/lib/swr-keys"

interface ReportDetailDialogProps {
  open: boolean
  reportId: string | null
  onClose: () => void
}

export function ReportDetailDialog({ open, reportId, onClose }: ReportDetailDialogProps) {
  const validId = reportId && reportId.trim() !== "" ? reportId : null

  const { data: report, isLoading } = useSWR(
    open && validId ? SWR_KEYS.reportDetail(validId) : null,
    () => withRetryFetcher(() => getDailyReportDetail(validId!)),
  )

  const status = report ? getStatusDisplay(report.submittedAt) : null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            日報詳細
            {status && (
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading && <div className="py-8 text-center text-muted-foreground">読み込み中...</div>}

        {!isLoading && !report && (
          <div className="py-8 text-center text-muted-foreground">日報が見つかりません</div>
        )}

        {!isLoading && report && (
          <div className="space-y-4">
            {/* 日付 */}
            <div className="text-lg font-semibold">{formatReportDateLong(report.date)}</div>

            <div className="border-t my-2" />

            {/* 予定タスク */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  予定タスク ({report.plannedTasks.length}件)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.plannedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">なし</p>
                ) : (
                  <ul className="space-y-1">
                    {report.plannedTasks.map((task) => (
                      <li key={task.id} className="text-sm flex justify-between">
                        <span>{task.taskName}</span>
                        {task.hours && <span className="text-muted-foreground">{task.hours}h</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 実績タスク */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  実績タスク ({report.actualTasks.length}件)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.actualTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">なし</p>
                ) : (
                  <ul className="space-y-1">
                    {report.actualTasks.map((task) => (
                      <li key={task.id} className="text-sm flex justify-between">
                        <span>{task.taskName}</span>
                        {task.hours && <span className="text-muted-foreground">{task.hours}h</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* まとめ・所感 */}
            {report.summary && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">まとめ・所感</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{report.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* 困っていること */}
            {report.issues && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">困っていること</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{report.issues}</p>
                </CardContent>
              </Card>
            )}

            {/* 連絡事項 */}
            {report.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">連絡事項</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
