//dashboard/page.tsx

"use client";

import { useDashboardAttendance } from "./hooks/useDashboardAttendance";
import { ClockCard } from "./components/ClockCard";
import { PunchButtons } from "./components/PunchButtons";
import { SummaryCard } from "./components/SummaryCard";
import { SessionList } from "./components/SessionList";
import { WeeklyAlert } from "./components/WeeklyAlert";
import { ClockInDialog } from "./components/ClockInDialog";
import { ClockOutDialog } from "./components/ClockOutDialog";
import { BreakDialog } from "./components/BreakDialog";
import { useClockDialogs } from "./hooks/useClockDialogs";

export default function Dashboard() {
    const {
        attendance,
        currentSession,
        onBreak,
        weekTotalMs,
        handleClockIn,
        handleClockOut,
        handleBreakStart,
        handleBreakEnd,
    } = useDashboardAttendance();

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
    } = useClockDialogs();

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
                <ClockInDialog
                    open={showClockInDialog}
                    onClose={closeDialogs}
                    onSubmit={handleClockIn}
                />
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
    );
}