import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceRecord } from "../../../../shared/types/Attendance";
import { SessionItem } from "./SessionItem";
import { formatDurationMs } from "@/lib/time";
import { calculateDayWorkHours } from "@/lib/calculation";
import { toJSTDateString } from "../../../lib/time";

interface Props {
    selectedDate: Date | undefined;
    selectedDayData: AttendanceRecord | null;
}

export function DayDetailCard({
    selectedDate,
    selectedDayData,
}: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>詳細情報</CardTitle>
                <CardDescription>
                    {selectedDate?.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                    })}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {selectedDayData ? (
                    <>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">セッション数</span>
                                <Badge>{selectedDayData.sessions.length}回</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>総勤務時間</span>
                                <span className="text-xl">
                                    {formatDurationMs(calculateDayWorkHours(selectedDayData.sessions))}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <p className="text-sm text-muted-foreground">セッション詳細</p>

                            {selectedDayData.sessions.map((s, i) => (
                                <SessionItem
                                    key={s.id}
                                    session={s}
                                    index={i}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        この日の勤怠データはありません
                    </p>
                )}
            </CardContent>
        </Card>
    );
}