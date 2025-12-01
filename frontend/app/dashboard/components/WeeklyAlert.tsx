import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatDurationMs } from "@/lib/time";

export function WeeklyAlert({ weeklyHours }: { weeklyHours: number }) {
    // 時間をミリ秒に変換（18時間、20時間）
    const EIGHTEEN_HOURS_MS = 18 * 60 * 60 * 1000; // 64,800,000 ミリ秒
    const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000; // 72,000,000 ミリ秒

    // 値の検証（数値であることを確認）
    const validWeeklyHours = typeof weeklyHours === 'number' && !isNaN(weeklyHours) ? weeklyHours : 0;

    // 警告表示条件を明示的にチェック（20時間を超過した場合のみ表示）
    const isNearLimit = validWeeklyHours >= EIGHTEEN_HOURS_MS && validWeeklyHours < TWENTY_HOURS_MS;
    const isOverLimit = validWeeklyHours >= TWENTY_HOURS_MS;

    return (
        <Card>
            <CardHeader>
                <CardTitle>今週の勤務時間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <p className="text-3xl">{formatDurationMs(validWeeklyHours)}</p>
                {isNearLimit && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            週20時間に近づいています（残り：{formatDurationMs(TWENTY_HOURS_MS - validWeeklyHours)}）
                        </AlertDescription>
                    </Alert>
                )}
                {isOverLimit && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            週20時間を超過しています。管理者に連絡してください。
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}