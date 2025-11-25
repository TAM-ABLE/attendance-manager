//lib/csv.ts
/*
import { formatTimeForCSV, formatDuration, getWeekday } from './time';
import { DayAttendance, User } from '@/types/DayAttendance';
import { User } from "@/types/User";

export const exportUserMonthlyCSV = (
    user: User,
    monthData: DayAttendance[],
    currentMonth: Date
) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    const header = [
        `社員ID,${user.employeeId}`,
        `名前,${user.name}`,
        ''
    ];

    const tableHeader = ['日付,曜日,出勤①,退勤①,出勤②,退勤②,出勤③,退勤③,休憩合計,合計勤務,予定勤務,残業,遅刻,早退,有給/欠勤,出勤日'];

    const dataRows = monthData.map(dayData => {
        const session1 = dayData.sessions[0];
        const session2 = dayData.sessions[1];
        const session3 = dayData.sessions[2];

        const clockIn1 = session1 ? formatTimeForCSV(session1.clockIn) : '-';
        const clockOut1 = session1 ? formatTimeForCSV(session1.clockOut) : '-';
        const clockIn2 = session2 ? formatTimeForCSV(session2.clockIn) : '-';
        const clockOut2 = session2 ? formatTimeForCSV(session2.clockOut) : '-';
        const clockIn3 = session3 ? formatTimeForCSV(session3.clockIn) : '-';
        const clockOut3 = session3 ? formatTimeForCSV(session3.clockOut) : '-';

        let totalBreakMinutes = 0;
        dayData.sessions.forEach(session => {
            session.breaks.forEach(brk => {
                if (brk.end) totalBreakMinutes += (brk.end - brk.start) / (1000 * 60);
            });
        });
        if (session1 && session1.clockOut && session2 && session2.clockIn) totalBreakMinutes += (session2.clockIn - session1.clockOut) / (1000 * 60);
        if (session2 && session2.clockOut && session3 && session3.clockIn) totalBreakMinutes += (session3.clockIn - session2.clockOut) / (1000 * 60);

        const totalWorkTime = formatDuration(dayData.totalHours * 60);
        const breakTime = formatDuration(totalBreakMinutes);
        const scheduledTime = formatDuration(8 * 60);
        const overtimeTime = formatDuration(Math.max(0, (dayData.totalHours - 8) * 60));

        return `${year}-${month}-${dayData.day},${getWeekday(dayData.date)},${clockIn1},${clockOut1},${clockIn2},${clockOut2},${clockIn3},${clockOut3},${breakTime},${totalWorkTime},${scheduledTime},${overtimeTime},-, -, -, ${dayData.hasData ? 'o' : 'x'}`;
    });

    const csvContent = [...header, ...tableHeader, ...dataRows].join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `勤怠_${user.name}_${year}年${month}月.csv`;
    link.click();
};
*/