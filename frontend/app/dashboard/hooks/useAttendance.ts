"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
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

// SWR fetchers
async function fetchToday() {
    const result = await getToday();
    if (result.success) {
        return result.data;
    }
    throw new Error(result.error.message);
}

async function fetchWeekTotal() {
    const result = await getWeekTotal();
    if (result.success) {
        return result.data?.netWorkMs ?? 0;
    }
    throw new Error(result.error.message);
}

export function useAttendance() {
    const [error, setError] = useState<string | null>(null);

    // 今日のデータを取得
    const {
        data: attendance,
        mutate: mutateToday,
        error: todayError,
    } = useSWR("attendance-today", fetchToday, {
        onError: (err) => {
            console.error("Failed to load today:", err);
            setError(err.message);
        },
    });

    // 週合計を取得
    const {
        data: weekTotalMs,
        mutate: mutateWeekTotal,
        error: weekError,
    } = useSWR("attendance-week-total", fetchWeekTotal, {
        onError: (err) => {
            console.error("Failed to load week total:", err);
        },
    });

    // 派生状態を計算
    const currentSession = useMemo(() => detectCurrentSession(attendance ?? null), [attendance]);
    const onBreak = useMemo(() => detectOnBreak(currentSession), [currentSession]);

    // 全データ再取得
    const loadAll = useCallback(async () => {
        setError(null);
        await Promise.all([mutateToday(), mutateWeekTotal()]);
    }, [mutateToday, mutateWeekTotal]);

    // 今日のデータのみ再取得
    const refreshToday = useCallback(async () => {
        setError(null);
        await mutateToday();
    }, [mutateToday]);

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
        attendance: attendance ?? null,
        currentSession,
        onBreak,
        weekTotalMs: weekTotalMs ?? 0,
        error: error ?? todayError?.message ?? weekError?.message ?? null,
        handleClockIn,
        handleClockOut,
        handleBreakStart,
        handleBreakEnd,
        refresh: loadAll,
    };
}
