"use client"

import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
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
import type { User } from "@/types/Attendance"
import { useDeleteUser } from "../hooks/useDeleteUser"
import { useEditUser } from "../hooks/useEditUser"
import { UserFormFields } from "./UserFormFields"

type EditUserDialogProps = {
  target: User | null
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

export function EditUserDialog({ target, onClose, onUpdated, onDeleted }: EditUserDialogProps) {
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (target) {
      const [last, ...rest] = target.name.split(" ")
      setLastName(last)
      setFirstName(rest.join(" "))
      setEmail(target.email)
    }
  }, [target])

  const { submit, loading, error, clearError } = useEditUser(() => {
    onClose()
    onUpdated()
  })

  const {
    submit: submitDelete,
    loading: deleteLoading,
    error: deleteError,
    clearError: clearDeleteError,
  } = useDeleteUser(() => {
    setShowDeleteConfirm(false)
    onClose()
    onDeleted()
  })

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      clearError()
      clearDeleteError()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!target) return
    await submit(target.id, { lastName, firstName, email })
  }

  const handleDelete = async () => {
    if (!target) return
    await submitDelete(target.id)
  }

  const canDelete = target?.role !== "admin"

  return (
    <>
      <Dialog open={!!target} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザー情報編集</DialogTitle>
            <DialogDescription>社員番号は変更できません。</DialogDescription>
          </DialogHeader>
          {target && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>社員番号</Label>
                <Input value={target.employeeNumber} disabled className="font-mono" />
              </div>

              <UserFormFields
                lastName={lastName}
                firstName={firstName}
                email={email}
                onLastNameChange={setLastName}
                onFirstNameChange={setFirstName}
                onEmailChange={setEmail}
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {deleteError && <p className="text-red-500 text-sm">{deleteError}</p>}

              <DialogFooter className="flex-row justify-between sm:justify-between">
                {canDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading || deleteLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button type="submit" disabled={loading || deleteLoading}>
                    {loading ? "更新中..." : "更新"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ユーザーを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.name}
              さんのアカウントと、関連する勤怠データ・日報をすべて削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
