// types.ts
export type Break = {
    id: string;
    start: number;
    end?: number;
};

export interface WorkSession {
    id: string;
    clockIn: number;
    clockOut?: number;
    breaks: Break[];
}

export interface AttendanceRecord {
    date: string;
    sessions: WorkSession[];
}

export interface ApiBreak {
    id: string;
    break_start: string;
    break_end?: string | null;
}

export interface ApiWorkSession {
    id: string;
    clock_in: string;
    clock_out?: string | null;
    breaks: ApiBreak[];
}

export interface ApiAttendance {
    id: string;
    user_id: string;
    date: string;
    work_sessions: ApiWorkSession[];
    created_at: string;
}