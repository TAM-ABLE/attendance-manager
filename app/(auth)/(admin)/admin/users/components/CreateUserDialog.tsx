"use client"

import { Mail, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCreateUser } from "../hooks/useCreateUser"
import { UserFormFields } from "./UserFormFields"

type CreateUserDialogProps = {
  onCreated: () => void
}

export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")

  const { submit, loading, error, successData, clearSuccess, clearError } = useCreateUser(() => {
    setOpen(false)
    onCreated()
  })

  const resetForm = () => {
    setLastName("")
    setFirstName("")
    setEmail("")
    clearError()
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) resetForm()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const ok = await submit({ lastName, firstName, email })
    if (ok) resetForm()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <UserFormFields
              lastName={lastName}
              firstName={firstName}
              email={email}
              onLastNameChange={setLastName}
              onFirstNameChange={setFirstName}
              onEmailChange={setEmail}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "登録中..." : "登録"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 登録完了ダイアログ */}
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
    </>
  )
}
