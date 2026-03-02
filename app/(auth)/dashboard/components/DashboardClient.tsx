"use client"

import { HelpPopover } from "@/components/HelpPopover"
import type { AuthUser } from "@/lib/auth/server"
import { useClockDialogs } from "../hooks/useClockDialogs"
import { type DashboardInitialData, useDashboardAttendance } from "../hooks/useDashboardAttendance"
import { BreakDialog } from "./BreakDialog"
import { ClockCard } from "./ClockCard"
import { ClockInDialog } from "./ClockInDialog"
import { ClockOutDialog } from "./ClockOutDialog"
import { PunchButtons } from "./PunchButtons"
import { SessionList } from "./SessionList"
import { SummaryCard } from "./SummaryCard"
import { WeeklyAlert } from "./WeeklyAlert"

type DashboardClientProps = {
  user: AuthUser
  initialData?: DashboardInitialData
}

export function DashboardClient({ user, initialData }: DashboardClientProps) {
  const {
    attendance,
    currentSession,
    onBreak,
    weekTotalMs,
    handleClockIn,
    handleClockOut,
    handleBreakStart,
    handleBreakEnd,
  } = useDashboardAttendance(user, initialData)

  const {
    showClockInDialog,
    showClockOutDialog,
    showBreakDialog,
    breakMode,
    openClockIn,
    openClockOut,
    openBreakStart,
    openBreakEnd,
    closeDialogs,
  } = useClockDialogs()

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <HelpPopover>
          <div className="space-y-3">
            <h4 className="font-semibold">ダッシュボードの使い方</h4>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong className="text-foreground">出勤/退勤ボタン：</strong>
                勤務の開始・終了時に押してください。
              </p>
              <p>
                <strong className="text-foreground">休憩ボタン：</strong>
                休憩開始・終了を記録できます。
              </p>
              <p>
                <strong className="text-foreground">本日の勤務状況：</strong>
                勤務時間・休憩時間・セッション数が表示されます。
              </p>
              <p>
                <strong className="text-foreground">本日のセッション履歴：</strong>
                本日の勤務時間が表示されます。複数回の出勤・退勤も可能です。
              </p>
            </div>
          </div>
        </HelpPopover>
      </div>
      <ClockCard />

      {/* 出勤・退勤ボタン */}
      <PunchButtons
        onClockIn={openClockIn}
        onClockOut={openClockOut}
        onBreakStart={openBreakStart}
        onBreakEnd={openBreakEnd}
        onBreak={onBreak}
        isWorking={!!currentSession}
        sessionCount={attendance?.sessions?.length || 0}
      />

      <SummaryCard attendance={attendance} />
      <SessionList attendance={attendance} currentSession={currentSession} onBreak={onBreak} />
      <WeeklyAlert weeklyMs={weekTotalMs} />

      {/* ダイアログ */}
      {showClockInDialog && (
        <ClockInDialog open={showClockInDialog} onClose={closeDialogs} onSubmit={handleClockIn} />
      )}

      {showClockOutDialog && (
        <ClockOutDialog
          open={showClockOutDialog}
          onClose={closeDialogs}
          onSubmit={handleClockOut}
        />
      )}

      {showBreakDialog && (
        <BreakDialog
          open={showBreakDialog}
          mode={breakMode}
          onClose={closeDialogs}
          onStart={handleBreakStart}
          onEnd={handleBreakEnd}
        />
      )}
    </div>
  )
}
