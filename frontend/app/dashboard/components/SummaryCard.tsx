import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDurationMs } from "@/lib/time";
import { AttendanceRecord } from "../../../../shared/types/Attendance";
import { calculateDayWorkHours, calculateDayBreakHours } from "@/lib/calculation";

export function SummaryCard({ attendance }: { attendance: AttendanceRecord | null }) {

    if (!attendance || !attendance.sessions) return null;

    const sessionCount = attendance.sessions.length;

    // 勤務時間（ms）
    const work = calculateDayWorkHours(attendance.sessions);

    // 休憩時間（ms）
    const breaks = calculateDayBreakHours(attendance.sessions);

    return (
        <Card>
            <CardHeader>
                <CardTitle>本日の勤務状況</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">勤務時間</p>
                        <p className="text-2xl">{formatDurationMs(work)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">休憩時間</p>
                        <p className="text-2xl">{formatDurationMs(breaks)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">セッション数</p>
                        <p className="text-2xl">{sessionCount}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}