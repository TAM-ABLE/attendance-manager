"use client"

import { HelpPopover } from "@/components/HelpPopover"

export function MonthlyHelpPopover() {
  return (
    <HelpPopover>
      <div className="space-y-3">
        <h4 className="font-semibold">月別詳細の使い方</h4>
        <p className="text-muted-foreground">
          ユーザーの月別勤怠データを確認・編集できます。CSVダウンロードボタンで勤怠情報をダウンロードできます。
        </p>
      </div>
    </HelpPopover>
  )
}
