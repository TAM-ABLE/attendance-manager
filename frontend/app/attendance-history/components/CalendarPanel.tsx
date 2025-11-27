
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { AttendanceRecord } from "../../../../shared/types/Attendance";

interface Props {
    selectedDate: Date | undefined;
    currentMonth: Date;
    attendanceData: AttendanceRecord[];
    onSelectDate: (d: Date | undefined) => void;
    onMonthChange: (d: Date) => void;
}

export function CalendarPanel({
    selectedDate,
    currentMonth,
    attendanceData,
    onSelectDate,
    onMonthChange,
}: Props) {
    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>
                        {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                    </CardTitle>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                const d = new Date(currentMonth);
                                d.setMonth(d.getMonth() - 1);
                                onMonthChange(d);
                            }}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                const d = new Date(currentMonth);
                                d.setMonth(d.getMonth() + 1);
                                onMonthChange(d);
                            }}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={onSelectDate}
                    month={currentMonth}
                    onMonthChange={onMonthChange}
                    className="rounded-md border"
                    modifiers={{
                        hasAttendance: attendanceData.map(record =>
                            new Date(record.sessions[0]?.clockIn)
                        ),
                    }}
                    modifiersClassNames={{
                        hasAttendance: "bg-primary/10 font-semibold",
                    }}
                />
            </CardContent>
        </Card>
    );
}