// shared/types/Attendance.ts

export interface Break {
    id: string;
    start?: number; // timestamp (ms)
    end?: number;
}

export interface WorkSession {
    id: string;
    clockIn?: number;
    clockOut?: number;
    breaks: Break[];
}

export interface AttendanceRecord {
    date: string; // 'YYYY-MM-DD'
    sessions: WorkSession[];
    workTotalMs: number;   // 計算済み勤務時間 (ms)
    breakTotalMs: number;  // 計算済み休憩時間 (ms)
}

export interface User {
    id: string;
    name: string;
    email: string;
    employeeId: string; //社員ID
}

export interface Task {
    task: string;
    hours: string;
}
