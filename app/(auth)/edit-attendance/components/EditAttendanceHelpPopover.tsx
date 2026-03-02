"use client"

import { HelpPopover } from "@/components/HelpPopover"

export function EditAttendanceHelpPopover() {
  return (
    <HelpPopover>
      <div className="space-y-3">
        <h4 className="font-semibold">勤怠編集の使い方</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            <strong className="text-foreground">月の移動：</strong>
            表示月を切り替えられます。
          </p>
          <p>
            <strong className="text-foreground">勤怠表：</strong>
            日ごとの出退勤時間・休憩・合計勤務時間と、月の出勤日数・総勤務時間が確認できます。
          </p>
          <p>
            <strong className="text-foreground">勤怠の編集：</strong>
            編集ボタンをクリックすると、その日の出勤・退勤時間を編集できます。
          </p>
          <p>
            <strong className="text-foreground">複数回出勤：</strong>
            1日に複数回出勤すると、出勤2・出勤3と追加されていきます。
          </p>
          <p>
            <strong className="text-foreground">月次締め：</strong>
            勤怠を締めるボタンを押すと、その月の勤怠が確定されます。
          </p>
        </div>
      </div>
    </HelpPopover>
  )
}
