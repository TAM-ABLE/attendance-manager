"use client";

import type { AuthUser } from "@/lib/auth/server";
import { useDashboardAttendance } from "../hooks/useDashboardAttendance";
import { ClockCard } from "./ClockCard";
import { PunchButtons } from "./PunchButtons";
import { SummaryCard } from "./SummaryCard";
import { SessionList } from "./SessionList";
import { WeeklyAlert } from "./WeeklyAlert";
import { ClockInDialog } from "./ClockInDialog";
import { ClockOutDialog } from "./ClockOutDialog";
import { BreakDialog } from "./BreakDialog";
import { useClockDialogs } from "../hooks/useClockDialogs";

type DashboardClientProps = {
    user: AuthUser;
};

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
    } = useDashboardAttendance(user);

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
