"use client"

import { HelpPopover } from "@/components/HelpPopover"

export function ReportListHelpPopover() {
  return (
    <HelpPopover>
      <div className="space-y-3">
        <h4 className="font-semibold">日報履歴の使い方</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            <strong className="text-foreground">月の移動：</strong>
            表示月を切り替えられます。
          </p>
          <p>
            <strong className="text-foreground">ユーザー選択：</strong>
            日報を閲覧したいユーザーを選択できます。
          </p>
          <p>
            <strong className="text-foreground">一覧表示：</strong>
            日付・ステータス・提出日時・予定/実績の件数が表示されます。
          </p>
          <p>
            <strong className="text-foreground">日報の詳細：</strong>
            詳細ボタンをクリックすると、日報の詳細を確認できます。
          </p>
          <p>
            <strong className="text-foreground">ステータス：</strong>
            提出完了で「提出済」、未提出は「下書き」と表示されます。
          </p>
        </div>
      </div>
    </HelpPopover>
  )
}
