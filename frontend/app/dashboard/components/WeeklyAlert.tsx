import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatDurationMs } from "@/lib/time";

// 時間をミリ秒に変換する定数
const HOUR_IN_MS = 60 * 60 * 1000;
const HOURS_18_MS = 18 * HOUR_IN_MS;
const HOURS_20_MS = 20 * HOUR_IN_MS;

export function WeeklyAlert({ weeklyMs }: { weeklyMs: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>今週の勤務時間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <p className="text-3xl">{formatDurationMs(weeklyMs)}</p>
                {weeklyMs >= HOURS_18_MS && weeklyMs < HOURS_20_MS && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            週20時間に近づいています（残り：{formatDurationMs(HOURS_20_MS - weeklyMs)}）
                        </AlertDescription>
                    </Alert>
                )}
                {weeklyMs >= HOURS_20_MS && (
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