"use client"

import { Edit, KeyRound, Mail, Plus, User } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
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
import { useEditUser } from "../hooks/useEditUser"
import { usePasswordReset } from "../hooks/usePasswordReset"
import { useResendInvite } from "../hooks/useResendInvite"
import { useUserFormDialog } from "../hooks/useUserFormDialog"
import { useUsers } from "../hooks/useUsers"

type UserManagementViewProps = {
  initialUsers?: UserType[]
}

type EmailAction = {
  userId: string
  userName: string
  type: "resend-invite" | "password-reset"
}

export function UserManagementView({ initialUsers }: UserManagementViewProps) {
  const { users, refetch } = useUsers(initialUsers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [emailAction, setEmailAction] = useState<EmailAction | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  const { submit, loading, error, successData, clearSuccess, clearError } = useCreateUser(() => {
    setDialogOpen(false)
    refetch()
  })

  // ===== 編集ダイアログ =====
  const editDialog = useUserFormDialog()
  const {
    submit: editSubmit,
    loading: editLoading,
    error: editError,
    clearError: clearEditError,
  } = useEditUser(() => {
    editDialog.handleOpenChange(false)
    refetch()
  })

  const handleEditOpenChange = (open: boolean) => {
    editDialog.handleOpenChange(open)
    if (!open) clearEditError()
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editDialog.target) return
    await editSubmit(editDialog.target.id, editDialog.form)
  }

  // ===== 招待メール再送 =====
  const {
    submit: resendSubmit,
    loading: resendLoading,
    error: resendError,
    clearError: clearResendError,
  } = useResendInvite(() => {
    setEmailAction(null)
    setActionSuccessMessage("招待メールを再送しました")
  })

  // ===== パスワードリセット =====
  const {
    submit: resetSubmit,
    loading: resetLoading,
    error: resetError,
    clearError: clearResetError,
  } = usePasswordReset(() => {
    setEmailAction(null)
    setActionSuccessMessage("パスワードリセットメールを送信しました")
  })

  const handleEmailActionConfirm = async () => {
    if (!emailAction) return
    if (emailAction.type === "resend-invite") {
      await resendSubmit(emailAction.userId)
    } else {
      await resetSubmit(emailAction.userId)
    }
  }

  const handleEmailActionCancel = () => {
    setEmailAction(null)
    clearResendError()
    clearResetError()
  }

  // ===== 新規登録ダイアログ =====
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

  const emailActionLoading = resendLoading || resetLoading
  const emailActionError = resendError || resetError

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
                  社員番号は自動採番されます。ユーザーは一般ユーザーとして登録されます。登録後に招待メールが送信されます。
                  ※ 招待メールは1時間あたり2通まで送信可能です。
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
                <TableHead className="w-[100px]">ステータス</TableHead>
                <TableHead className="w-[160px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    ユーザーが登録されていません
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.employeeNumber}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {user.passwordChanged ? (
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          設定済み
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300">
                          招待中
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-7 px-2 sm:px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => editDialog.openDialog(user)}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">編集</span>
                        </Button>
                        {user.role !== "admin" &&
                          (user.passwordChanged ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 sm:px-3"
                              onClick={() =>
                                setEmailAction({
                                  userId: user.id,
                                  userName: user.name,
                                  type: "password-reset",
                                })
                              }
                            >
                              <KeyRound className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">リセット</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 sm:px-3"
                              onClick={() =>
                                setEmailAction({
                                  userId: user.id,
                                  userName: user.name,
                                  type: "resend-invite",
                                })
                              }
                            >
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">再送</span>
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editDialog.open} onOpenChange={handleEditOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザー情報編集</DialogTitle>
            <DialogDescription>社員番号は変更できません。</DialogDescription>
          </DialogHeader>
          {editDialog.target && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>社員番号</Label>
                <Input value={editDialog.target.employeeNumber} disabled className="font-mono" />
              </div>

              <div className="space-y-2">
                <Label>名前</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="姓"
                      value={editDialog.form.lastName}
                      onChange={(e) => editDialog.updateField("lastName", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="名"
                    value={editDialog.form.firstName}
                    onChange={(e) => editDialog.updateField("firstName", e.target.value)}
                    className="flex-1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={editDialog.form.email}
                    onChange={(e) => editDialog.updateField("email", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {editError && <p className="text-red-500 text-sm">{editError}</p>}

              <DialogFooter>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "更新中..." : "更新"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!successData}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザー登録完了</DialogTitle>
            <DialogDescription>
              {successData &&
                `${successData.name}（${successData.employeeNumber}）を登録しました。`}
            </DialogDescription>
          </DialogHeader>
          {successData && (
            <div className="rounded border bg-muted p-3 text-sm">
              <Mail className="inline h-4 w-4 mr-1.5 align-text-bottom" />
              {successData.email}{" "}
              に招待メールを送信しました。メール内のリンクからパスワードを設定できます。
            </div>
          )}
          <DialogFooter>
            <Button onClick={clearSuccess}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 招待再送・パスワードリセット確認ダイアログ */}
      <AlertDialog
        open={!!emailAction}
        onOpenChange={(open: boolean) => !open && handleEmailActionCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {emailAction?.type === "resend-invite" ? "招待メール再送" : "パスワードリセット"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {emailAction?.type === "resend-invite"
                ? `${emailAction.userName} に招待メールを再送します。よろしいですか？`
                : `${emailAction?.userName} にパスワードリセットメールを送信します。よろしいですか？`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {emailActionError && <p className="text-red-500 text-sm">{emailActionError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={emailActionLoading}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmailActionConfirm} disabled={emailActionLoading}>
              {emailActionLoading ? "送信中..." : "送信"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* アクション成功メッセージ */}
      <Dialog
        open={!!actionSuccessMessage}
        onOpenChange={(open) => !open && setActionSuccessMessage(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>送信完了</DialogTitle>
            <DialogDescription>{actionSuccessMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setActionSuccessMessage(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
