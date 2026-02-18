"use client"

import { AlertTriangle, Check, Copy, Mail, MessageSquare, Plus, User } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { User as UserType } from "@/types/Attendance"
import { useCreateUser } from "../hooks/useCreateUser"
import { useUsers } from "../hooks/useUsers"

type UserManagementViewProps = {
  initialUsers?: UserType[]
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // フォールバック: clipboard API が使えない環境向け
      const textarea = document.createElement("textarea")
      textarea.value = value
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [value])

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="ml-1">{copied ? "コピー済み" : "コピー"}</span>
    </Button>
  )
}

export function UserManagementView({ initialUsers }: UserManagementViewProps) {
  const { users, refetch } = useUsers(initialUsers)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { submit, loading, error, successData, clearSuccess, clearError } = useCreateUser(() => {
    setDialogOpen(false)
    refetch()
  })

  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")

  const resetForm = () => {
    setLastName("")
    setFirstName("")
    setEmail("")
    clearError()
  }

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await submit({ lastName, firstName, email })
    if (ok) resetForm()
  }

  const firstLoginUrl =
    typeof window !== "undefined" ? `${window.location.origin}/first-login` : "/first-login"

  const slackMessage = useMemo(() => {
    if (!successData) return ""
    return [
      `${successData.name}さん`,
      "",
      "勤怠管理システムのアカウントを作成しました。",
      "以下の情報で初回ログインをお願いします。",
      "",
      `ログインURL: ${firstLoginUrl}`,
      `初期パスワード: ${successData.initialPassword}`,
      "",
      "初回ログイン時にパスワードの変更が求められます。",
    ].join("\n")
  }, [successData, firstLoginUrl])

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">ユーザー一覧</CardTitle>
            <CardDescription className="text-xs sm:text-sm">登録済みユーザーの管理</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                新規登録
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規ユーザー登録</DialogTitle>
                <DialogDescription>
                  社員番号は自動採番されます。ユーザーは一般ユーザーとして登録されます。初期パスワードは自動生成されます。
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>名前</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="create-last-name"
                        type="text"
                        placeholder="姓"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <Input
                      id="create-first-name"
                      type="text"
                      placeholder="名"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="flex-1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-email">メールアドレス</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="create-email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? "登録中..." : "登録"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">社員番号</TableHead>
                <TableHead>名前</TableHead>
                <TableHead>メールアドレス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    ユーザーが登録されていません
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.employeeNumber}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!successData}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>ユーザー登録完了</DialogTitle>
            <DialogDescription>
              {successData &&
                `${successData.name}（${successData.employeeNumber}）を登録しました。`}
            </DialogDescription>
          </DialogHeader>
          {successData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Slack通知用メッセージ
                </Label>
                <div className="rounded border bg-muted p-3 text-sm whitespace-pre-wrap break-words">
                  {slackMessage}
                </div>
                <CopyButton value={slackMessage} />
              </div>

              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  このパスワードはこの画面を閉じると再表示できません。必ずコピーして対象ユーザーに伝えてください。
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={clearSuccess}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
