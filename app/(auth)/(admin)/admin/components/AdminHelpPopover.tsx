"use client"

import { HelpPopover } from "@/components/HelpPopover"

export function AdminHelpPopover() {
  return (
    <HelpPopover>
      <div className="space-y-3">
        <h4 className="font-semibold">管理者ダッシュボードの使い方</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            <strong className="text-foreground">ユーザー管理：</strong>
            ユーザーの登録・編集・削除ができます。
          </p>
          <p>
            <strong className="text-foreground">月別詳細：</strong>
            ユーザーの月別勤怠データを確認・編集できます。CSVダウンロードボタンで、選択したユーザーの勤怠情報をダウンロードできます。
          </p>
          <p>
            <strong className="text-foreground">提出された日報：</strong>
            本日または前日に提出された日報を確認できます。
          </p>
          <p>
            <strong className="text-foreground">通知設定：</strong>
            通知の設定を行います。
          </p>
        </div>
      </div>
    </HelpPopover>
  )
}
