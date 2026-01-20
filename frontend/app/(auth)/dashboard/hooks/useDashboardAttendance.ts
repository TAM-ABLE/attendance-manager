"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import type { AttendanceRecord, WorkSession, Task } from "@attendance-manager/shared/types/Attendance";
import { apiClient } from "@/lib/api-client";
import { withRetry, withRetryFetcher } from "@/lib/auth/with-retry";
import { SWR_KEYS } from "@/lib/swr-keys";
import type { AuthUser } from "@/lib/auth/server";

// ============ API呼び出し関数 ============

function clockIn(userName: string, plannedTasks: Task[], clockInTime?: string) {
    return apiClient<{ slack_ts?: string }>("/attendance/clock-in", {
        method: "POST",
        body: { userName, plannedTasks, clockInTime },
    });
}

function clockOut(userName: string, actualTasks: Task[], summary: string, issues: string, notes: string, clockOutTime?: string) {
    return apiClient<{ slack_ts?: string }>("/attendance/clock-out", {
        method: "POST",
        body: { userName, actualTasks, summary, issues, notes, clockOutTime },
    });
}

function startBreak(breakStartTime?: string) {
    return apiClient<null>("/attendance/breaks/start", {
        method: "POST",
        body: { breakStartTime },
    });
}

function endBreak(breakEndTime?: string) {
    return apiClient<null>("/attendance/breaks/end", {
        method: "POST",
        body: { breakEndTime },
    });
}

function getToday() {
    return apiClient<AttendanceRecord | null>("/attendance/today");
}

function getWeekTotal() {
    return apiClient<{ netWorkMs: number } | null>("/attendance/week/total");
}

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

// SWR fetchers（withRetryFetcher で 401 時に自動リフレッシュ）
async function fetchToday() {
    return withRetryFetcher(getToday);
}

async function fetchWeekTotal() {
    const data = await withRetryFetcher(getWeekTotal);
    return data?.netWorkMs ?? 0;
}

export function useDashboardAttendance(user: AuthUser) {
    const [error, setError] = useState<string | null>(null);

    // 今日のデータを取得
    const {
        data: attendance,
        mutate: mutateToday,
        error: todayError,
    } = useSWR(SWR_KEYS.ATTENDANCE_TODAY, fetchToday, {
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
    } = useSWR(SWR_KEYS.ATTENDANCE_WEEK_TOTAL, fetchWeekTotal, {
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
        async (plannedTasks: Task[], clockInTime?: string) => {
            setError(null);
            const userName = user.name;
            const result = await withRetry(() => clockIn(userName, plannedTasks, clockInTime));

            if (!result.success) {
                console.error("Clock-in failed:", result.error);
                setError(result.error.message);
                return result;
            }

            await loadAll();
            return result;
        },
        [loadAll, user]
    );

    // 退勤 - 週合計が変わるので全データ再取得
    const handleClockOut = useCallback(
        async (actualTasks: Task[], summary: string, issues: string, notes: string, clockOutTime?: string) => {
            setError(null);
            const userName = user.name;
            const result = await withRetry(() => clockOut(userName, actualTasks, summary, issues, notes, clockOutTime));

            if (!result.success) {
                console.error("Clock-out failed:", result.error);
                setError(result.error.message);
                return result;
            }

            await loadAll();
            return result;
        },
        [loadAll, user]
    );

    // 休憩開始 - 週合計は変わらないので今日のみ再取得
    const handleBreakStart = useCallback(async (breakStartTime?: string) => {
        setError(null);
        const result = await withRetry(() => startBreak(breakStartTime));

        if (!result.success) {
            console.error("Break-start failed:", result.error);
            setError(result.error.message);
            return result;
        }

        await refreshToday();
        return result;
    }, [refreshToday]);

    // 休憩終了 - 週合計は変わらないので今日のみ再取得
    const handleBreakEnd = useCallback(async (breakEndTime?: string) => {
        setError(null);
        const result = await withRetry(() => endBreak(breakEndTime));

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
