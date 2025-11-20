"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { AttendanceRecord, WorkSession, ApiAttendance } from "../types";

export function useAttendance() {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;

    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [weeklyAttendance, setWeeklyAttendance] = useState<AttendanceRecord[]>([]);
    const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
    const [onBreak, setOnBreak] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL;

    /** --- Slack/外部通知用 --- */
    const sendAPI = async <T>(endpoint: string, payload: T) => {
        try {
            const res = await fetch(`${API_BASE}/slack/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
        } catch (err) {
            console.error("Error sending attendance:", err);
        }
    };

    const fetchAttendance = async (date: string) => {
        const res = await fetch(`${API_BASE}/database/attendance?userId=${userId}&date=${date}`);
        if (!res.ok) return null;

        const data: ApiAttendance = await res.json();
        if (!data) return { date, sessions: [] };

        return {
            date: data.date,
            sessions: data.work_sessions.map((s) => ({
                id: s.id,
                clockIn: new Date(s.clock_in).getTime(),
                clockOut: s.clock_out ? new Date(s.clock_out).getTime() : undefined,
                breaks: s.breaks.map((b) => ({
                    id: b.id,
                    start: new Date(b.break_start).getTime(),
                    end: b.break_end ? new Date(b.break_end).getTime() : undefined,
                })),
            })),
        };
    };

    const updateTodayAttendance = (updated: AttendanceRecord) => {
        setAttendance(updated);

        setWeeklyAttendance((prev) => {
            const idx = prev.findIndex((r) => r.date === updated.date);
            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = updated;
                return copy;
            } else {
                return [...prev, updated];
            }
        });

        const session = updated.sessions.find((s) => !s.clockOut) ?? null;
        setCurrentSession(session);
        setOnBreak(session?.breaks.some((b) => !b.end) ?? false);
    };

    // 初期ロード & 今週の勤怠取得
    useEffect(() => {
        if (!userId) return;

        const init = async () => {
            const today = new Date().toISOString().split("T")[0];
            const todayData = await fetchAttendance(today);
            if (todayData) updateTodayAttendance(todayData);

            // 今週（月～金）の勤怠
            const day = new Date().getDay();
            const monday = new Date();
            monday.setDate(new Date().getDate() - ((day + 6) % 7));

            const records: AttendanceRecord[] = [];
            for (let i = 0; i < 5; i++) {
                const date = new Date(monday);
                date.setDate(monday.getDate() + i);
                const ymd = date.toISOString().split("T")[0];
                if (ymd === today) {
                    if (todayData) records.push(todayData);
                    continue;
                }
                const record = await fetchAttendance(ymd);
                if (record) records.push(record);
            }
            setWeeklyAttendance(records);
        };

        init();
    }, [userId]);

    // 今週の合計時間
    const weeklyHours = useMemo(() => {
        let total = 0;
        weeklyAttendance.forEach((record) => {
            if (!record.sessions) return;
            record.sessions.forEach((s) => {
                if (!s.clockOut) return;
                const work = s.clockOut - s.clockIn;
                const breaks = s.breaks.reduce((sum, b) => sum + (b.end ? b.end - b.start : 0), 0);
                total += work - breaks;
            });
        });
        return total / (1000 * 60 * 60); // 時間単位
    }, [weeklyAttendance]);

    // 出勤
    const handleClockIn = async (payload?: { name: string; plannedTasks?: { task: string; hours: string }[] }) => {
        if (!userId) return;
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(`${API_BASE}/database/clock-in`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, date: today }),
        });
        if (res.ok) {
            const data = await fetchAttendance(today);
            if (data) updateTodayAttendance(data);
            if (payload) await sendAPI("clock-in", payload);
        }
    };

    // 退勤
    const handleClockOut = async (payload?: { name: string; actualTasks?: { task: string; hours: string }[]; summary?: string; issues?: string; notes?: string }) => {
        if (!currentSession) return;
        const res = await fetch(`${API_BASE}/database/clock-out`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: currentSession.id }),
        });
        if (res.ok) {
            const today = new Date().toISOString().split("T")[0];
            const data = await fetchAttendance(today);
            if (data) updateTodayAttendance(data);
            if (payload) await sendAPI("clock-out", payload);
        }
    };

    // 休憩開始
    const handleBreakStart = async (payload?: { name: string }) => {
        if (!currentSession) return;
        await fetch(`${API_BASE}/database/break-start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: currentSession.id }),
        });
        const today = new Date().toISOString().split("T")[0];
        const data = await fetchAttendance(today);
        if (data) updateTodayAttendance(data);
        if (payload) await sendAPI("break-start", payload);
    };

    // 休憩終了
    const handleBreakEnd = async (payload?: { name: string }) => {
        if (!currentSession) return;
        const lastBreak = currentSession.breaks[currentSession.breaks.length - 1];
        if (!lastBreak) return;
        await fetch(`${API_BASE}/database/break-end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ breakId: lastBreak.id }),
        });
        const today = new Date().toISOString().split("T")[0];
        const data = await fetchAttendance(today);
        if (data) updateTodayAttendance(data);
        if (payload) await sendAPI("break-end", payload);
    };

    return {
        attendance,
        currentSession,
        onBreak,
        weeklyHours,
        handleClockIn,
        handleClockOut,
        handleBreakStart,
        handleBreakEnd,
    };
}