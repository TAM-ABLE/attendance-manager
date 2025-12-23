"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee } from "lucide-react";
import { AttendanceRecord, WorkSession } from "../../../../shared/types/Attendance";
import { formatClockTime, formatDurationMs } from "@/lib/time";
import { useEffect, useState } from "react";

export function SessionList({
    attendance,
    currentSession,
    onBreak,
}: {
    attendance: AttendanceRecord | null;
    currentSession: WorkSession | null;
    onBreak: boolean;
}) {
    // 現在時刻を state 管理（Date.now() を直接使わない）
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => {
            setNow(Date.now()); // 1秒おきに更新
        }, 1000);

        return () => clearInterval(id);
    }, []);

    if (!attendance || !attendance.sessions?.length) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>本日のセッション履歴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {attendance.sessions.map((s, i) => {
                    // セッション終了時間
                    let end: number;
                    if (s.clockOut != null) {
                        end = s.clockOut;                           // 退勤済み
                    } else if (currentSession?.id === s.id) {
                        end = now;                                  // 今勤務中（Date.now() → now に置換）
                    } else {
                        end = s.clockIn ?? 0;                       // 過去セッションの未終了 → 0扱い
                    }

                    const work = end - (s.clockIn ?? 0);

                    // 休憩時間合計
                    const breakMs = s.breaks.reduce((sum, b) => {
                        let breakEnd: number;

                        if (b.end != null) {
                            breakEnd = b.end;                       // 休憩終了済み
                        } else if (currentSession?.id === s.id && onBreak) {
                            breakEnd = now;                         // 休憩中（Date.now() → now）
                        } else {
                            breakEnd = b.start ?? 0;                // 休憩してない扱い
                        }

                        return sum + (breakEnd - (b.start ?? 0));
                    }, 0);

                    return (
                        <div key={s.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant={s.clockOut ? "secondary" : "default"}>
                                    セッション {i + 1}
                                </Badge>
                                <p className="text-sm">
                                    {formatClockTime(s.clockIn)} ~{" "}
                                    {s.clockOut ? formatClockTime(s.clockOut) : "勤務中"}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                        <p className="text-xs text-blue-600">勤務時間</p>
                                    </div>
                                    <p className="text-base sm:text-lg text-blue-900">
                                        {formatDurationMs(work - breakMs)}
                                    </p>
                                </div>

                                {s.breaks.length > 0 && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Coffee className="h-4 w-4 text-orange-600" />
                                            <p className="text-xs text-orange-600">休憩時間</p>
                                        </div>
                                        <p className="text-base sm:text-lg text-orange-900">
                                            {formatDurationMs(breakMs)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
