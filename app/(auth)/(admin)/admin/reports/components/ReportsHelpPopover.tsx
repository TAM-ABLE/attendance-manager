"use client"

import { HelpPopover } from "@/components/HelpPopover"

export function ReportsHelpPopover() {
  return (
    <HelpPopover>
      <div className="space-y-3">
        <h4 className="font-semibold">日報提出状況の使い方</h4>
        <p className="text-muted-foreground">本日と前日の日報提出状況を確認できます。</p>
      </div>
    </HelpPopover>
  )
}
