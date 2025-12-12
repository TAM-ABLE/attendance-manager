/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useState, useEffect } from "react";
import { AttendanceRecord, WorkSession, Task } from "../../../../shared/types/Attendance";
import { clockInWithTasks } from "@/app/actions/clock-in";
import { clockOutWithTasks } from "@/app/actions/clock-out";
import { breakStart } from "@/app/actions/break-start";
import { breakEnd } from "@/app/actions/break-end";


// セッション検出（出勤中かどうか）
function detectCurrentSession(attendance: AttendanceRecord | null): WorkSession | null {
    if (!attendance?.sessions?.length) return null;
    const lastSession = attendance.sessions[attendance.sessions.length - 1];
    return lastSession.clockOut ? null : lastSession;
}

// 休憩中かどうか検出
function detectOnBreak(currentSession: WorkSession | null): boolean {
    if (!currentSession?.breaks?.length) return false;
    const lastBreak = currentSession.breaks[currentSession.breaks.length - 1];
    return !lastBreak.end; // end が null → 休憩中
}

export function useAttendance() {
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
    const [onBreak, setOnBreak] = useState<boolean>(false);
    const [weekTotalMs, setWeekTotalMs] = useState<number>(0);

    // 初期読み込み
    const loadAll = async () => {
        try {
            const todayData: AttendanceRecord = await fetch("/api/attendance/day").then(r => r.json());
            const weekly = await fetch("/api/attendance/week-total-hours").then(r => r.json());

            const session = detectCurrentSession(todayData);

            setAttendance(todayData);
            setCurrentSession(session);
            setOnBreak(detectOnBreak(session));
            setWeekTotalMs(weekly.netWorkMs);
        } catch (e) {
            console.error("Failed to load attendance:", e);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);


    const handleClockIn = async (plannedTasks: Task[]) => {
        const res = await clockInWithTasks(plannedTasks);
        await loadAll();

        if (!res.success) {
            console.error("Clock-in failed:", res.error);
        }
    };

    // 退勤
    const handleClockOut = async (actualTasks: Task[], summary: string, issues: string, notes: string) => {
        const res = await clockOutWithTasks(actualTasks, summary, issues, notes);
        await loadAll();

        if (!res.success) {
            console.error("Clock-out failed:", res.error);
        }
    };

    // 休憩開始
    const handleBreakStart = async () => {
        const res = await breakStart();
        await loadAll();

        if (!res.success) {
            console.error("Break-start failed:", res.error);
        }
    };

    // 休憩終了
    const handleBreakEnd = async () => {
        const res = await breakEnd();
        await loadAll();

        if (!res.success) {
            console.error("Break-end failed:", res.error);
        }
    };

    return {
        attendance,
        currentSession,
        onBreak,
        weekTotalMs,
        handleClockIn,
        handleClockOut,
        handleBreakStart,
        handleBreakEnd,
    };
}
