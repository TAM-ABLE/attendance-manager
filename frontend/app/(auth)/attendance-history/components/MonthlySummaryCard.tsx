import { formatDurationMs } from "@attendance-manager/shared/lib/time"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  totalDays: number
  totalHours: number
}

export function MonthlySummaryCard({ totalDays, totalHours }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>月間サマリー</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-1">出勤日数</p>
            <p className="text-2xl">{totalDays}日</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">総勤務時間</p>
            <p className="text-2xl">{formatDurationMs(totalHours)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
