"use client";

import { useAttendanceHistory } from "@/app/attendance-history/hooks/useAttendanceHistory";
import { CalendarPanel } from "@/app/attendance-history/components/CalendarPanel";
import { DayDetailCard } from "@/app/attendance-history/components/DayDetailCard";
import { MonthlySummaryCard } from "@/app/attendance-history/components/MonthlySummaryCard";

export default function AttendanceHistory() {

    const { attendanceData, currentMonth, selectedDate, selectedDayData, setCurrentMonth, setSelectedDate } = useAttendanceHistory();

    // バックエンドから返された計算済みの値を合計
    const totalMonthWorkMs = attendanceData.reduce((acc, d) => acc + d.workTotalMs, 0);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">勤怠履歴</h2>
            <p className="text-muted-foreground">カレンダーから日付を選択して詳細を表示</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <CalendarPanel
                    selectedDate={selectedDate}
                    currentMonth={currentMonth}
                    attendanceData={attendanceData}
                    onSelectDate={setSelectedDate}
                    onMonthChange={setCurrentMonth}
                />

                <div className="lg:col-span-2 h-full">
                    <DayDetailCard
                        selectedDate={selectedDate}
                        selectedDayData={selectedDayData}
                    />
                </div>
            </div>

            <MonthlySummaryCard totalDays={attendanceData.length} totalHours={totalMonthWorkMs} />
        </div>
    );
}
