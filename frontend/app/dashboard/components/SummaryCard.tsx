import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDurationMs } from "@/lib/time";
import { AttendanceRecord } from "../../../../shared/types/Attendance";

export function SummaryCard({ attendance }: { attendance: AttendanceRecord | null }) {

    if (!attendance || !attendance.sessions) return null;
    const sessionCount = attendance.sessions.length;
    const work = attendance.sessions.reduce((sum, s) => {
        if (!s.clockOut) return sum;
        const work = s.clockOut - s.clockIn;
        const breaks = s.breaks.reduce((t, b) => t + (b.end ? b.end - b.start : 0), 0);
        return sum + (work - breaks);
    }, 0);
    const breaks = attendance.sessions.reduce(
        (sum, s) => sum + s.breaks.reduce((t, b) => t + (b.end ? b.end - b.start : 0), 0),
        0
    );

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