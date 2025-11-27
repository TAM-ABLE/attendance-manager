"use client";

import { useAttendance } from "@/app/attendance-history/hooks/useAttendance";
import { CalendarPanel } from "@/app/attendance-history/components/CalendarPanel";
import { DayDetailCard } from "@/app/attendance-history/components/DayDetailCard";
import { MonthlySummaryCard } from "@/app/attendance-history/components/MonthlySummaryCard";
import { calculateMonthWorkHours } from "@/lib/calculation";

export default function AttendanceHistory() {

    const { attendanceData, currentMonth, selectedDate, selectedDayData, setCurrentMonth, setSelectedDate } = useAttendance();

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">勤怠履歴</h2>
            <p className="text-muted-foreground">カレンダーから日付を選択して詳細を表示</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CalendarPanel
                    selectedDate={selectedDate}
                    currentMonth={currentMonth}
                    attendanceData={attendanceData}
                    onSelectDate={setSelectedDate}
                    onMonthChange={setCurrentMonth}
                />

                <DayDetailCard
                    selectedDate={selectedDate}
                    selectedDayData={selectedDayData}
                />
            </div>

            <MonthlySummaryCard totalDays={attendanceData.length} totalHours={calculateMonthWorkHours(attendanceData)} />
        </div>
    );
}