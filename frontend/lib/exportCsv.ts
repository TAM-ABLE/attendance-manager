// lib/exportCsv.ts
import { DayAttendance } from "../../shared/types/Attendance";
import { formatClockTime, formatDurationMs } from "./time";

export const exportMonthlyAttendanceCSV = (monthData: DayAttendance[], userName: string) => {
    // CSVヘッダー
    const headers = [
        "日付",
        "曜日",
        "出勤①",
        "退勤①",
        "出勤②",
        "退勤②",
        "出勤③",
        "退勤③",
        "休憩合計",
        "合計勤務時間",
    ];

    // CSVの行を作成
    const rows = monthData.map(d => [
        d.dateLabel,
        d.weekday,
        d.session1ClockIn != null ? formatClockTime(d.session1ClockIn) : "-",
        d.session1ClockOut != null ? formatClockTime(d.session1ClockOut) : "-",
        d.session2ClockIn != null ? formatClockTime(d.session2ClockIn) : "-",
        d.session2ClockOut != null ? formatClockTime(d.session2ClockOut) : "-",
        d.session3ClockIn != null ? formatClockTime(d.session3ClockIn) : "-",
        d.session3ClockOut != null ? formatClockTime(d.session3ClockOut) : "-",
        d.hasData ? formatDurationMs(d.breakTotalHours) : "-",
        d.hasData ? formatDurationMs(d.workTotalHours) : "-",
    ]);

    // CSV文字列を結合
    const csvContent =
        [`"氏名: ${userName}"`, headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.map(f => `"${f}"`).join(","))].join("\n");

    // BOM付きBlobを作る（Excelで文字化け防止）
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${userName}_attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
