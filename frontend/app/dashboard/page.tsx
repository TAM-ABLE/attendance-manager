//dashboard/page.tsx

"use client";

import { useAttendance } from "./hooks/useAttendance";
import { ClockCard } from "./components/ClockCard";
import { PunchButtons } from "./components/PunchButtons";
import { SummaryCard } from "./components/SummaryCard";
import { SessionList } from "./components/SessionList";
import { WeeklyAlert } from "./components/WeeklyAlert";
import { ClockInDialog } from "./components/ClockInDialog";
import { ClockOutDialog } from "./components/ClockOutDialog";
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
    } = useAttendance();

    const {
        showClockInDialog,
        showClockOutDialog,
        openClockIn,
        openClockOut,
        closeDialogs,
    } = useClockDialogs();

    return (
        <div className="space-y-6">
            <ClockCard />

            {/* 出勤・退勤ボタン */}
            <PunchButtons
                onClockIn={openClockIn}
                onClockOut={openClockOut}
                onBreakStart={handleBreakStart}
                onBreakEnd={handleBreakEnd}
                onBreak={onBreak}
                isWorking={!!currentSession}
            />

            <SummaryCard attendance={attendance} />
            <SessionList attendance={attendance} currentSession={currentSession} onBreak={onBreak} />
            <WeeklyAlert weeklyMs={weekTotalMs} />

            {/* ダイアログ */}
            <ClockInDialog
                open={showClockInDialog}
                onClose={closeDialogs}
                onSubmit={handleClockIn}
            />

            <ClockOutDialog
                open={showClockOutDialog}
                onClose={closeDialogs}
                onSubmit={handleClockOut}
            />
        </div>
    );
}