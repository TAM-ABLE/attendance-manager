import { AttendanceRecord } from "../types";

export const loadAttendance = (date: string): AttendanceRecord | null => {
    const data = localStorage.getItem(`attendance_${date}`);
    return data ? JSON.parse(data) : null;
};

export const saveAttendance = (record: AttendanceRecord) => {
    localStorage.setItem(`attendance_${record.date}`, JSON.stringify(record));
};