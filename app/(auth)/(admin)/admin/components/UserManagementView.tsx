"use client"

import { Check, Lock, Mail, Plus, User, X } from "lucide-react"
import { useState } from "react"
import { SuccessDialog } from "@/components/SuccessDialog"
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
import { useCreateUser, usePasswordStrength } from "../hooks/useCreateUser"
import { useUsers } from "../hooks/useUsers"

type UserManagementViewProps = {
  initialUsers?: UserType[]
}

export function UserManagementView({ initialUsers }: UserManagementViewProps) {
  const { users, refetch } = useUsers(initialUsers)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { submit, loading, error, successData, clearSuccess, clearError } = useCreateUser(() => {
    setDialogOpen(false)
    refetch()
  })

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const passwordStrength = usePasswordStrength(password)

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    clearError()
  }

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordStrength.isValid) return
    const ok = await submit({ name, email, password })
    if (ok) resetForm()
  }

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
                  社員番号は自動採番されます。ユーザーは一般ユーザーとして登録されます。
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">名前</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="create-name"
                      type="text"
                      placeholder="山田 太郎"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
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

                <div className="space-y-2">
                  <Label htmlFor="create-password">パスワード</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="create-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {password && (
                    <div className="text-xs space-y-1 mt-2">
                      <div className="flex items-center gap-1">
                        {passwordStrength.checks.minLength ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span
                          className={
                            passwordStrength.checks.minLength
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          8文字以上
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {passwordStrength.checks.hasLetter ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span
                          className={
                            passwordStrength.checks.hasLetter
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          英字を含む
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {passwordStrength.checks.hasNumber ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span
                          className={
                            passwordStrength.checks.hasNumber
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          数字を含む
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <DialogFooter>
                  <Button type="submit" disabled={loading || !passwordStrength.isValid}>
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

      <SuccessDialog
        open={!!successData}
        title="ユーザー登録完了"
        description={
          successData ? `${successData.name}（${successData.employeeNumber}）を登録しました。` : ""
        }
        onClose={clearSuccess}
      />
    </div>
  )
}
