"use client"

import type { AuthUser } from "@/lib/auth/server"
import { useClockDialogs } from "../hooks/useClockDialogs"
import { useDashboardAttendance } from "../hooks/useDashboardAttendance"
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
}

export function DashboardClient({ user }: DashboardClientProps) {
  const {
    attendance,
    currentSession,
    onBreak,
    weekTotalMs,
    handleClockIn,
    handleClockOut,
    handleBreakStart,
    handleBreakEnd,
  } = useDashboardAttendance(user)

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
