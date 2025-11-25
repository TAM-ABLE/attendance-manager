// shared/types/Attendance.ts

export interface Break {
    id: string;
    start: number; // timestamp などで扱う場合は number か Date
    end?: number;
}

export interface WorkSession {
    id: string;
    clockIn: number;
    clockOut?: number;
    breaks: Break[];
}

export interface AttendanceRecord {
    date: string; // 'YYYY-MM-DD'
    sessions: WorkSession[];
}

export interface DayAttendance {
    day: string;
    date: string;
    hasData: boolean;
    session1ClockIn?: number | null;
    session1ClockOut?: number | null;
    session2ClockIn?: number | null;
    session2ClockOut?: number | null;
    session3ClockIn?: number | null;
    session3ClockOut?: number | null;
    workTotalHours: number; //ms
    breakTotalHours: number; //ms
}

export interface User {
    id: string;
    name: string;
    email: string;
    employeeId: string; //社員ID
};