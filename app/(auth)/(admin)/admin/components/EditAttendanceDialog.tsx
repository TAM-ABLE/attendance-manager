"use client"

import { useState } from "react"
import { Loader } from "@/components/Loader"
import { SuccessDialog } from "@/components/SuccessDialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatClockTime, mergeDateAndTime } from "@/lib/time"
import type { Break, WorkSession } from "@/types/Attendance"

interface Props {
  open: boolean
  date: string | null //yyy-mm-dd形式
  onClose: () => void
  onSave: () => Promise<void>
  sessions: WorkSession[]
  setSessions: (s: WorkSession[]) => void
}

export function EditAttendanceDialog({
  open,
  date,
  onClose,
  onSave,
  sessions,
  setSessions,
}: Props) {
  const [mode, setMode] = useState<"form" | "loading" | "success">("form")

  const handleSubmit = async () => {
    try {
      setMode("loading")
      await onSave()
      setMode("success")
    } catch (e) {
      console.error(e)
      setMode("form")
    }
  }

  const handleCloseSuccess = () => {
    onClose()
    setMode("form")
  }

  const updateSession = (sessionId: string, field: "clockIn" | "clockOut", value: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, [field]: mergeDateAndTime(date, value) } : s,
      ),
    )
  }

  const updateBreak = (
    sessionId: string,
    breakId: string,
    field: "start" | "end",
    value: string,
  ) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              breaks: s.breaks.map((b) =>
                b.id === breakId ? { ...b, [field]: mergeDateAndTime(date, value) } : b,
              ),
            }
          : s,
      ),
    )
  }

  // セッション追加
  const addSession = () => {
    if (sessions.length >= 3) return
    const newSession: WorkSession = {
      id: crypto.randomUUID(),
      clockIn: mergeDateAndTime(date, "00:00"), // ← 初期値
      clockOut: mergeDateAndTime(date, "00:00"), // ← 初期値
      breaks: [],
    }
    setSessions([...sessions, newSession])
  }

  // 休憩追加
  const addBreak = (sessionId: string) => {
    const newBreak: Break = {
      id: crypto.randomUUID(),
      start: mergeDateAndTime(date, "00:00"), // ← 初期値
      end: mergeDateAndTime(date, "00:00"), // ← 初期値
    }
    setSessions(
      sessions.map((s) => (s.id === sessionId ? { ...s, breaks: [...s.breaks, newBreak] } : s)),
    )
  }

  // セッション削除
  const removeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId))
  }

  // 休憩削除
  const removeBreak = (sessionId: string, breakId: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, breaks: s.breaks.filter((b) => b.id !== breakId) } : s,
      ),
    )
  }

  // --- Loading UI ---
  if (mode === "loading") {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="flex justify-center py-12">
          <Loader size={50} border={4} />
        </DialogContent>
      </Dialog>
    )
  }

  // --- Success UI ---
  if (mode === "success") {
    return (
      <SuccessDialog
        open={open}
        title="保存完了"
        description="勤怠データを保存しました。"
        onClose={handleCloseSuccess}
      />
    )
  }

  // --- Form UI ---
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>勤怠データを編集</DialogTitle>
          <DialogDescription>出勤・退勤・休憩時間を編集できます。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {sessions.map((session, idx) => (
            <div key={session.id} className="border p-4 rounded-md space-y-4">
              <h3 className="font-semibold flex justify-between items-center">
                セッション {idx + 1}
                <Button size="sm" variant="ghost" onClick={() => removeSession(session.id)}>
                  ✕
                </Button>
              </h3>

              {/* 出勤 */}
              <div className="flex gap-4 items-center">
                <Label className="w-24">出勤</Label>
                <Input
                  type="time"
                  value={formatClockTime(session.clockIn)}
                  onChange={(e) => updateSession(session.id, "clockIn", e.target.value)}
                />
              </div>

              {/* 退勤 */}
              <div className="flex gap-4 items-center">
                <Label className="w-24">退勤</Label>
                <Input
                  type="time"
                  value={formatClockTime(session.clockOut)}
                  onChange={(e) => updateSession(session.id, "clockOut", e.target.value)}
                />
              </div>

              {/* 休憩 */}
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">休憩</h4>

                {session.breaks.map((br) => (
                  <div key={br.id} className="space-y-2">
                    {/* 削除ボタン */}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBreak(session.id, br.id)}
                      >
                        ✕
                      </Button>
                    </div>

                    {/* 開始 */}
                    <div className="flex gap-4 items-center">
                      <Label className="w-24">開始</Label>
                      <Input
                        type="time"
                        value={formatClockTime(br.start)}
                        onChange={(e) => updateBreak(session.id, br.id, "start", e.target.value)}
                      />
                    </div>

                    {/* 終了 */}
                    <div className="flex gap-4 items-center">
                      <Label className="w-24">終了</Label>
                      <Input
                        type="time"
                        value={formatClockTime(br.end)}
                        onChange={(e) => updateBreak(session.id, br.id, "end", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => addBreak(session.id)}
                >
                  + 休憩追加
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* セッション追加ボタン - セッションの外 */}
        <Button
          variant="outline"
          className="w-full mb-4"
          disabled={sessions.length >= 3}
          onClick={addSession}
        >
          + セッション追加
        </Button>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
