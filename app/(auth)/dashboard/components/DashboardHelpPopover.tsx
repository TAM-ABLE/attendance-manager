"use client"

import { HelpPopover } from "@/components/HelpPopover"

export function DashboardHelpPopover() {
  return (
    <HelpPopover>
      <div className="space-y-3">
        <h4 className="font-semibold">ダッシュボードの使い方</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            <strong className="text-foreground">ステータス表示：</strong>
            現在の状態（未出勤・出勤中・休憩中）がバッジで表示されます。
          </p>
          <p>
            <strong className="text-foreground">出勤/退勤ボタン：</strong>
            勤務の開始・終了時に押してください。
          </p>
          <p>
            <strong className="text-foreground">休憩ボタン：</strong>
            出勤中に休憩の開始・終了を記録できます。
          </p>
          <p>
            <strong className="text-foreground">本日の勤務状況：</strong>
            勤務時間・休憩時間・セッション数が表示されます。
          </p>
          <p>
            <strong className="text-foreground">本日のセッション履歴：</strong>
            本日の勤務時間が表示されます。複数回の出勤・退勤も可能です。
          </p>
          <p>
            <strong className="text-foreground">週次アラート：</strong>
            今週の合計勤務時間が表示され、長時間労働の場合は警告が出ます。
          </p>
        </div>
      </div>
    </HelpPopover>
  )
}
