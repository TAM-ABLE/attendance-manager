import { Badge } from "@/components/ui/badge";
import { WorkSession } from "../../../../shared/types/Attendance";
import { formatDurationMs, formatClockTime } from "@/lib/time";
import { calculateSessionWorkHours } from "@/lib/calculation";

interface Props {
    session: WorkSession;
    index: number;
}

export function SessionItem({ session, index }: Props) {
    return (
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
                <Badge variant="outline">セッション {index + 1}</Badge>
                <span className="text-sm">{formatDurationMs(calculateSessionWorkHours(session))}</span>
            </div>

            <div className="text-sm space-y-1">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">出勤</span>
                    <span>{formatClockTime(session.clockIn)}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-muted-foreground">退勤</span>
                    <span>{formatClockTime(session.clockOut)}</span>
                </div>

                {session.breaks.length > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">休憩</span>
                        <span>{session.breaks.length}回</span>
                    </div>
                )}
            </div>

            {session.breaks.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                    {session.breaks.map((brk, brkIdx) => (
                        <div
                            key={brkIdx}
                            className="flex justify-between text-xs text-muted-foreground"
                        >
                            <span>休憩{brkIdx + 1}</span>
                            <span>
                                {formatClockTime(brk.start)} - {formatClockTime(brk.end)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}