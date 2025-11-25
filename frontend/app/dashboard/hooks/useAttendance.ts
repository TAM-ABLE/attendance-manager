"use client";

import { useState, useEffect } from "react";
import { AttendanceRecord, WorkSession } from "../../../../shared/types/Attendance"

//現在のセッション判定関数
function detectCurrentSession(attendance: AttendanceRecord | null): WorkSession | null {
    if (!attendance) return null;
    if (!attendance.sessions || attendance.sessions.length === 0) return null;

    const lastSession = attendance.sessions[attendance.sessions.length - 1];

    // 退勤していなければ現在のセッション
    if (!lastSession.clockOut) {
        return lastSession;
    }

    return null;
}

//現在休憩中かどうかの判定関数
function detectOnBreak(currentSession: WorkSession | null): boolean {
    if (!currentSession) return false;

    const breaks = currentSession.breaks;
    if (!breaks || breaks.length === 0) return false;

    const lastBreak = breaks[breaks.length - 1];

    // end がなければ休憩中
    return !lastBreak.end;
}

export function useAttendance() {
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [weekTotalHours, setWeekTotalHours] = useState<number>(0);
    const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
    const [onBreak, setOnBreak] = useState(<boolean>false);

    useEffect(() => {

        const init = async () => {
            const todayData: AttendanceRecord = await fetch("/api/attendance/day").then(r => r.json());
            const hours = await fetch("/api/attendance/week-total-hours").then(r => r.json());

            const session = detectCurrentSession(todayData);
            const breakState = detectOnBreak(session);

            setAttendance(todayData);
            setWeekTotalHours(hours.netWorkMs);
            setCurrentSession(session);
            setOnBreak(breakState);
        };

        init();
    }, []);

    // 出勤
    const handleClockIn = async () => {
        // 1. 出勤 API を叩く
        const ok = await fetch("/api/attendance/clock-in").then(r => r.json());

        // 2. 出勤後のデータを再取得
        const todayData: AttendanceRecord = await fetch("/api/attendance/day").then(r => r.json());

        // 3. 現在のセッションを再判定
        const newSession = detectCurrentSession(todayData);

        // 4. state 更新
        setAttendance(todayData);
        setCurrentSession(newSession);
    };

    // 退勤
    const handleClockOut = async () => {

        const ok = await fetch("/api/attendance/clock-out").then(r => r.json());

        const todayData = await fetch("/api/attendance/day").then(r => r.json());
        const hours = await fetch("/api/attendance/week-total-hours").then(r => r.json());
        setAttendance(todayData);
        setWeekTotalHours(hours.netWorkMs);
        setCurrentSession(null);
    };

    // 休憩開始
    const handleBreakStart = async () => {

        const ok = await fetch("/api/attendance/break-start").then(r => r.json());

        const todayData: AttendanceRecord = await fetch("/api/attendance/day").then(r => r.json());

        setOnBreak(true);
    };

    // 休憩終了
    const handleBreakEnd = async () => {

        const ok = await fetch("/api/attendance/break-end").then(r => r.json());

        const todayData: AttendanceRecord = await fetch("/api/attendance/day").then(r => r.json());

        setOnBreak(false);

    };


    return {
        attendance,
        currentSession,
        onBreak,
        weekTotalHours,
        handleClockIn,
        handleClockOut,
        handleBreakStart,
        handleBreakEnd,
    };
}