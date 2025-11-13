import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatWeeklyHours } from "../lib/time";

export function WeeklyAlert({ weeklyHours }: { weeklyHours: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>今週の勤務時間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <p className="text-3xl">{formatWeeklyHours(weeklyHours)}</p>
                {weeklyHours >= 18 && weeklyHours < 20 && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            週20時間に近づいています（残り：{formatWeeklyHours(20 - weeklyHours)}）
                        </AlertDescription>
                    </Alert>
                )}
                {weeklyHours >= 20 && (
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