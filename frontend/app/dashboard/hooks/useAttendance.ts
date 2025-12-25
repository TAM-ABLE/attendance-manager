"use client";

import { useState, useEffect, useCallback } from "react";
import type { AttendanceRecord, WorkSession, Task } from "../../../../shared/types/Attendance";
import { clockIn, clockOut, startBreak, endBreak, getToday, getWeekTotal } from "@/app/actions/attendance";

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
    const [error, setError] = useState<string | null>(null);

    // 今日のデータと週合計を両方取得
    const loadAll = useCallback(async () => {
        setError(null);
        try {
            const [todayResult, weeklyResult] = await Promise.all([getToday(), getWeekTotal()]);

            if (todayResult.success) {
                const todayData = todayResult.data;
                const session = detectCurrentSession(todayData);
                setAttendance(todayData);
                setCurrentSession(session);
                setOnBreak(detectOnBreak(session));
            } else {
                console.error("Failed to load today:", todayResult.error);
                setError(todayResult.error.message);
            }

            if (weeklyResult.success) {
                setWeekTotalMs(weeklyResult.data?.netWorkMs ?? 0);
            } else {
                console.error("Failed to load week total:", weeklyResult.error);
            }
        } catch (e) {
            console.error("Failed to load attendance:", e);
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    }, []);

    // 今日のデータのみ取得（休憩操作用 - 週合計は変わらない）
    const refreshToday = useCallback(async () => {
        setError(null);
        try {
            const result = await getToday();

            if (result.success) {
                const todayData = result.data;
                const session = detectCurrentSession(todayData);
                setAttendance(todayData);
                setCurrentSession(session);
                setOnBreak(detectOnBreak(session));
            } else {
                console.error("Failed to refresh today:", result.error);
                setError(result.error.message);
            }
        } catch (e) {
            console.error("Failed to refresh attendance:", e);
            setError(e instanceof Error ? e.message : "Unknown error");
        }
    }, []);

    // 初期読み込み
    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // 出勤 - 週合計が変わるので全データ再取得
    const handleClockIn = useCallback(
        async (plannedTasks: Task[]) => {
            setError(null);
            const result = await clockIn(plannedTasks);

            if (!result.success) {
                console.error("Clock-in failed:", result.error);
                setError(result.error.message);
                return result;
            }

            await loadAll();
            return result;
        },
        [loadAll]
    );

    // 退勤 - 週合計が変わるので全データ再取得
    const handleClockOut = useCallback(
        async (actualTasks: Task[], summary: string, issues: string, notes: string) => {
            setError(null);
            const result = await clockOut(actualTasks, summary, issues, notes);

            if (!result.success) {
                console.error("Clock-out failed:", result.error);
                setError(result.error.message);
                return result;
            }

            await loadAll();
            return result;
        },
        [loadAll]
    );

    // 休憩開始 - 週合計は変わらないので今日のみ再取得
    const handleBreakStart = useCallback(async () => {
        setError(null);
        const result = await startBreak();

        if (!result.success) {
            console.error("Break-start failed:", result.error);
            setError(result.error.message);
            return result;
        }

        await refreshToday();
        return result;
    }, [refreshToday]);

    // 休憩終了 - 週合計は変わらないので今日のみ再取得
    const handleBreakEnd = useCallback(async () => {
        setError(null);
        const result = await endBreak();

        if (!result.success) {
            console.error("Break-end failed:", result.error);
            setError(result.error.message);
            return result;
        }

        await refreshToday();
        return result;
    }, [refreshToday]);

    return {
        attendance,
        currentSession,
        onBreak,
        weekTotalMs,
        error,
        handleClockIn,
        handleClockOut,
        handleBreakStart,
        handleBreakEnd,
        refresh: loadAll,
    };
}
