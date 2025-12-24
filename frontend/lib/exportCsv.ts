// lib/exportCsv.ts
import { AttendanceRecord } from "../../shared/types/Attendance";
import { formatClockTime, formatDurationMsToHM, getWeekdayLabel, getDateLabel } from "./time";

export const exportMonthlyAttendanceCSV = (monthData: AttendanceRecord[], userName: string) => {
    // CSVヘッダー
    const headers = [
        "日付",
        "曜日",
        "セッション",
        "休憩合計",
        "合計勤務時間",
    ];

    // CSVの行を作成
    const rows = monthData.map(d => {
        const hasData = d.sessions.length > 0;
        const dateLabel = getDateLabel(d.date);
        const weekday = getWeekdayLabel(d.date);

        // セッション情報をテキスト化
        const sessionsText = d.sessions.map((s, i) =>
            `${i + 1}. ${formatClockTime(s.clockIn ?? undefined)}-${formatClockTime(s.clockOut ?? undefined)}`
        ).join(' / ') || '-';

        return [
            dateLabel,
            weekday,
            sessionsText,
            hasData ? formatDurationMsToHM(d.breakTotalMs) : "-",
            hasData ? formatDurationMsToHM(d.workTotalMs) : "-",
        ];
    });

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
