export interface WorkSession {
    id: string;
    clockIn: number;
    clockOut?: number;
    breaks: { start: number; end?: number }[];
}

export interface AttendanceRecord {
    date: string;
    sessions: WorkSession[];
}