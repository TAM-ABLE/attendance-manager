//dashboard/page.tsx

"use client";

import { useAttendance } from "./hooks/useAttendance";
import { ClockCard } from "./components/ClockCard";
import { PunchButtons } from "./components/PunchButtons";
import { SummaryCard } from "./components/SummaryCard";
import { SessionList } from "./components/SessionList";
import { WeeklyAlert } from "./components/WeeklyAlert";

export default function Dashboard() {

    const {
        attendance,
        currentSession,
        onBreak,
        weeklyHours,
        handleClockIn,
        handleClockOut,
        handleBreakStart,
        handleBreakEnd,
    } = useAttendance();

    return (
        <div className="space-y-6">
            <ClockCard />
            <PunchButtons
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                onBreakStart={handleBreakStart}
                onBreakEnd={handleBreakEnd}
                onBreak={onBreak}
                isWorking={!!currentSession}
            />
            <SummaryCard attendance={attendance} />
            <SessionList
                attendance={attendance}
                currentSession={currentSession}
                onBreak={onBreak}
            />
            <WeeklyAlert weeklyHours={weeklyHours} />
        </div>
    );
}