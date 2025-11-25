// app/admin/page.tsx
import { CalendarDays } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import { MonthlyAttendanceView } from "@/app/admin/components/MonthlyAttendanceView";

export default function AdminPage() {

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2>管理者ダッシュボード</h2>
                    <p className="text-muted-foreground">
                        チーム全体の勤怠・日報を管理
                    </p>
                </div>
            </div>

            <Tabs defaultValue="monthly" className="space-y-6">
                <TabsList className="grid grid-cols-2 w-full max-w-md">
                    <TabsTrigger value="monthly">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        月別詳細
                    </TabsTrigger>
                    <TabsTrigger value="settings">通知設定</TabsTrigger>
                </TabsList>

                <TabsContent value="monthly">
                    <MonthlyAttendanceView />
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>通知設定</CardTitle>
                            <CardDescription>
                                Slack通知やメール通知の設定（実装予定）
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p>週20時間超過アラート</p>
                                    <p className="text-sm text-muted-foreground">
                                        メンバーの週間勤務時間が20時間を超えた時に通知
                                    </p>
                                </div>
                                <Badge>有効</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p>月次レポート自動送信</p>
                                    <p className="text-sm text-muted-foreground">
                                        毎月1日に前月の集計レポートを自動送信
                                    </p>
                                </div>
                                <Badge variant="secondary">無効</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}