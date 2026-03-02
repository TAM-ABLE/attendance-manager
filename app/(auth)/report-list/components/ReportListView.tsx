"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { HelpPopover } from "@/components/HelpPopover"
import { MonthNavigator } from "@/components/MonthNavigator"
import { UserSelect } from "@/components/UserSelect"
import { Card, CardContent } from "@/components/ui/card"
import { useMonthNavigation } from "@/hooks/useMonthNavigation"
import type { UserForSelect } from "@/types/DailyReport"
import { useMonthlyReports } from "../hooks/useMonthlyReports"
import { useReportUsers } from "../hooks/useReportUsers"
import { ReportTable } from "./ReportTable"

const ReportDetailDialog = dynamic(
  () => import("@/components/ReportDetailDialog").then((mod) => mod.ReportDetailDialog),
  { ssr: false },
)

type ReportListViewProps = {
  initialUsers?: UserForSelect[]
}

export function ReportListView({ initialUsers }: ReportListViewProps) {
  const { currentMonth, handlePrevMonth, handleNextMonth, handleToday } = useMonthNavigation()
  const {
    users,
    selectedUser,
    setSelectedUser,
    isLoading: usersLoading,
  } = useReportUsers(initialUsers)
  const { reports, isLoading: reportsLoading } = useMonthlyReports(selectedUser, currentMonth)

  // 詳細ダイアログ
  const [detailReportId, setDetailReportId] = useState<string | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const handleViewDetail = (reportId: string) => {
    setDetailReportId(reportId)
    setShowDetailDialog(true)
  }

  const handleCloseDetail = () => {
    setShowDetailDialog(false)
    setDetailReportId(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">日報一覧</h2>
          <p className="text-muted-foreground">自分や他のユーザーの日報を閲覧できます。</p>
        </div>
        <HelpPopover>
          <div className="space-y-3">
            <h4 className="font-semibold">日報一覧の使い方</h4>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong className="text-foreground">月の移動：</strong>
                表示月を切り替えられます。
              </p>
              <p>
                <strong className="text-foreground">ユーザー選択：</strong>
                日報を閲覧したいユーザーを選択できます。
              </p>
              <p>
                <strong className="text-foreground">日報の詳細：</strong>
                詳細ボタンをクリックすると、日報の詳細を確認できます。
              </p>
              <p>
                <strong className="text-foreground">ステータス：</strong>
                日報を提出完了すると「提出済」、未提出だと「下書き」になります。
              </p>
            </div>
          </div>
        </HelpPopover>
      </div>

      {/* 月移動＆ユーザー選択 */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 月移動 */}
          <MonthNavigator
            currentMonth={currentMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />

          {/* ユーザー選択 */}
          <div className="flex items-center gap-2">
            <UserSelect
              users={users}
              value={selectedUser}
              onChange={setSelectedUser}
              disabled={usersLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* 日報一覧 */}
      {selectedUser && (
        <ReportTable reports={reports} isLoading={reportsLoading} onViewDetail={handleViewDetail} />
      )}

      {!selectedUser && !usersLoading && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">ユーザーを選択してください</p>
          </CardContent>
        </Card>
      )}

      {/* 詳細ダイアログ */}
      <ReportDetailDialog
        open={showDetailDialog}
        reportId={detailReportId}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
