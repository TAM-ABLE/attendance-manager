"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee } from "lucide-react";
import { AttendanceRecord, WorkSession } from "../../../../shared/types/Attendance";
import { calculateCompletedSession, calculateActiveSession } from "../../../../shared/lib/calculation";
import { formatClockTime, formatDurationMs } from "@/lib/time";
import { useEffect, useState, useMemo } from "react";

export function SessionList({
    attendance,
    currentSession,
    onBreak,
}: {
    attendance: AttendanceRecord | null;
    currentSession: WorkSession | null;
    onBreak: boolean;
}) {
    // 現在時刻を state 管理（進行中セッションのみに使用）
    const [now, setNow] = useState(() => Date.now());

    // 進行中セッションがある場合のみタイマーを動かす
    const hasActiveSession = currentSession != null && currentSession.clockOut == null;

    useEffect(() => {
        if (!hasActiveSession) return;

        const id = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(id);
    }, [hasActiveSession]);

    // sessionsを抽出（React Compilerの依存推論と一致させるため）
    const sessions = attendance?.sessions;

    // 完了済みセッションの計算結果をメモ化（毎秒再計算されない）
    const completedSessionsData = useMemo(() => {
        if (!sessions) return new Map<string, { workMs: number; breakMs: number }>();

        const map = new Map<string, { workMs: number; breakMs: number }>();
        for (const s of sessions) {
            if (s.clockOut != null) {
                map.set(s.id, calculateCompletedSession(s));
            }
        }
        return map;
    }, [sessions]);

    // Early return for null attendance
    if (!sessions?.length) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>本日のセッション履歴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {sessions.map((s, i) => {
                    let workMs: number;
                    let breakMs: number;

                    if (s.clockOut != null) {
                        // 完了済みセッション: メモ化された値を使用
                        const cached = completedSessionsData.get(s.id);
                        workMs = cached?.workMs ?? 0;
                        breakMs = cached?.breakMs ?? 0;
                    } else if (currentSession?.id === s.id) {
                        // 進行中セッション: リアルタイム計算（shared計算関数を使用）
                        const active = calculateActiveSession(s, now, onBreak);
                        workMs = active.workMs;
                        breakMs = active.breakMs;
                    } else {
                        // 未完了だが進行中でないセッション（異常ケース）
                        workMs = 0;
                        breakMs = 0;
                    }

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
                                <div className="bg-primary/10 border border-primary/30 rounded-md p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <p className="text-xs text-primary">勤務時間</p>
                                    </div>
                                    <p className="text-base sm:text-lg text-primary">
                                        {formatDurationMs(workMs)}
                                    </p>
                                </div>

                                {s.breaks.length > 0 && (
                                    <div className="bg-lime-50 border border-lime-200 rounded-md p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Coffee className="h-4 w-4 text-lime-600" />
                                            <p className="text-xs text-lime-600">休憩時間</p>
                                        </div>
                                        <p className="text-base sm:text-lg text-lime-900">
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
