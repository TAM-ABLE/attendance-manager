// dashboard/hooks/useAttendance.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { AttendanceRecord, WorkSession } from "../types";
import { loadAttendance, saveAttendance } from "../lib/storage";
import { calcWeeklyHours } from "../lib/time";

export type ClockInPayload = {
    name: string;
    plannedTasks: { task: string; hours: string }[];
};

export type ClockOutPayload = {
    name: string;
    actualTasks: { task: string; hours: string }[];
    summary: string;
    issues: string;
    notes: string;
};

export function useAttendance() {
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [weeklyHours, setWeeklyHours] = useState(0);

    // 初期ロード
    useEffect(() => {
        const today = new Date().toDateString();
        const data = loadAttendance(today);
        if (data) setAttendance(data);
    }, []);

    // localStorage を触る処理は useEffect に入れる（SSR安全）
    useEffect(() => {
        const total = calcWeeklyHours();
        setWeeklyHours(total);
    }, [attendance]);

    // ローカル保存 + state 更新
    const updateAttendance = (updated: AttendanceRecord) => {
        saveAttendance(updated);
        setAttendance(updated);
    };

    // 現在のセッション
    const currentSession = useMemo(
        () => attendance?.sessions.find((s) => !s.clockOut) ?? null,
        [attendance]
    );

    // 休憩中かどうか
    const onBreak = useMemo(
        () => currentSession?.breaks.some((b) => !b.end) ?? false,
        [currentSession]
    );

    // 現在セッション更新ユーティリティ
    const updateCurrentSession = (updater: (s: WorkSession) => WorkSession) => {
        if (!attendance) return;
        const updated = {
            ...attendance,
            sessions: attendance.sessions.map((s) =>
                !s.clockOut ? updater(s) : s
            ),
        };
        updateAttendance(updated);
    };

    // API 送信
    const sendAPI = async <T>(endpoint: string, payload: T) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/slack/${endpoint}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
        } catch (err) {
            console.error("Error sending attendance:", err);
        }
    };

    // 出勤
    const handleClockIn = async (payload: ClockInPayload) => {
        const now = Date.now();
        const today = new Date().toDateString();
        const newSession: WorkSession = {
            id: `session_${now}`,
            clockIn: now,
            breaks: [],
        };

        const updated: AttendanceRecord = attendance
            ? { ...attendance, sessions: [...attendance.sessions, newSession] }
            : { date: today, sessions: [newSession] };

        updateAttendance(updated);
        await sendAPI("clock-in", payload);
    };

    // 退勤
    const handleClockOut = async (payload: ClockOutPayload) => {
        if (!attendance) return;
        updateCurrentSession((s) => ({ ...s, clockOut: Date.now() }));
        await sendAPI("clock-out", payload);
    };

    // 休憩開始
    const handleBreakStart = async ({ name }: { name: string }) => {
        if (!attendance) return;
        updateCurrentSession((s) => ({
            ...s,
            breaks: [...s.breaks, { start: Date.now() }],
        }));
        await sendAPI("break-start", { name });
    };

    // 休憩終了
    const handleBreakEnd = async ({ name }: { name: string }) => {
        if (!attendance) return;
        updateCurrentSession((s) => {
            const bs = [...s.breaks];
            const last = bs[bs.length - 1];
            if (last && !last.end) last.end = Date.now();
            return { ...s, breaks: bs };
        });
        await sendAPI("break-end", { name });
    };

    return {
        attendance,
        currentSession,
        onBreak,
        weeklyHours, // ← useMemo ではなく useEffect の値
        handleClockIn,
        handleClockOut,
        handleBreakStart,
        handleBreakEnd,
    };
}