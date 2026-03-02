"use client"

import { useEffect, useState } from "react"
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
import { useEditUser } from "../hooks/useEditUser"
import { UserFormFields } from "./UserFormFields"

type EditUserDialogProps = {
  target: User | null
  onClose: () => void
  onUpdated: () => void
}

export function EditUserDialog({ target, onClose, onUpdated }: EditUserDialogProps) {
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      clearError()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!target) return
    await submit(target.id, { lastName, firstName, email })
  }

  return (
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

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "更新中..." : "更新"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
