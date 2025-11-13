"use client";

import { useState, useEffect } from "react";
import { AttendanceRecord, WorkSession } from "../types";
import { loadAttendance, saveAttendance } from "../lib/storage";
import { calcWeeklyHours } from "../lib/time";

export function useAttendance() {
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
    const [onBreak, setOnBreak] = useState(false);
    const [weeklyHours, setWeeklyHours] = useState(0);

    // データ読み込み
    useEffect(() => {
        const today = new Date().toDateString();
        const data = loadAttendance(today);
        if (data) {
            setAttendance(data);
            const activeSession = data.sessions.find((s) => !s.clockOut);
            if (activeSession) {
                setCurrentSession(activeSession);
                setOnBreak(!!activeSession.breaks.find((b) => !b.end));
            }
        }
        setWeeklyHours(calcWeeklyHours());
    }, []);

    const update = (updated: AttendanceRecord) => {
        saveAttendance(updated);
        setAttendance(updated);
        setWeeklyHours(calcWeeklyHours());
    };

    // 出勤
    const handleClockIn = () => {
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

        setCurrentSession(newSession);
        update(updated);
    };

    // 退勤
    const handleClockOut = () => {
        if (!attendance || !currentSession) return;
        const updated = {
            ...attendance,
            sessions: attendance.sessions.map((s) =>
                s.id === currentSession.id ? { ...s, clockOut: Date.now() } : s
            ),
        };
        setCurrentSession(null);
        setOnBreak(false);
        update(updated);
    };

    // 休憩開始
    const handleBreakStart = () => {
        if (!attendance || !currentSession) return;
        const updated = {
            ...attendance,
            sessions: attendance.sessions.map((s) =>
                s.id === currentSession.id
                    ? { ...s, breaks: [...s.breaks, { start: Date.now() }] }
                    : s
            ),
        };
        setOnBreak(true);
        update(updated);
    };

    // 休憩終了
    const handleBreakEnd = () => {
        if (!attendance || !currentSession) return;
        const updated = {
            ...attendance,
            sessions: attendance.sessions.map((s) => {
                if (s.id !== currentSession.id) return s;
                const breaks = [...s.breaks];
                const last = breaks[breaks.length - 1];
                if (last && !last.end) last.end = Date.now();
                return { ...s, breaks };
            }),
        };
        setOnBreak(false);
        update(updated);
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