import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function NotificationSettingsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">通知設定</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Slack通知やメール通知の設定（実装予定）
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg">
          <div>
            <p className="text-sm sm:text-base font-medium">週20時間超過アラート</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              メンバーの週間勤務時間が20時間を超えた時に通知
            </p>
          </div>
          <Badge className="w-fit">有効</Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg">
          <div>
            <p className="text-sm sm:text-base font-medium">月次締めSlack通知</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              勤怠締め時に月次CSVレポートをSlackへ送信
            </p>
          </div>
          <Badge className="w-fit">有効</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
