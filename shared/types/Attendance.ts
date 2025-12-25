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

/**
 * タスク（予定/実績）
 * NOTE: hours は number | null に統一（以前は string だった）
 */
export interface Task {
    taskName: string;
    hours: number | null;
}

/**
 * レガシーTask型（移行用）
 * @deprecated 新しいTaskインターフェースを使用してください
 */
export interface LegacyTask {
    task: string;
    hours: string;
}

/**
 * レガシーTask を新しいTask に変換
 */
export function migrateLegacyTask(legacy: LegacyTask): Task {
    return {
        taskName: legacy.task,
        hours: legacy.hours ? parseFloat(legacy.hours) : null,
    };
}
