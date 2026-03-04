"use client"

import { HelpPopover } from "@/components/HelpPopover"

export function SettingsHelpPopover() {
  return (
    <HelpPopover>
      <div className="space-y-3">
        <h4 className="font-semibold">通知設定の使い方</h4>
        <p className="text-muted-foreground">通知の設定を行います（実装予定）。</p>
      </div>
    </HelpPopover>
  )
}
