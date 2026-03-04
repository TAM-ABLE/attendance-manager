"use client"

import { HelpPopover } from "@/components/HelpPopover"

export function UsersHelpPopover() {
  return (
    <HelpPopover>
      <div className="space-y-3">
        <h4 className="font-semibold">ユーザー管理の使い方</h4>
        <p className="text-muted-foreground">
          ユーザーの登録・編集ができます。招待メールの再送やパスワードリセットも可能です。
        </p>
      </div>
    </HelpPopover>
  )
}
