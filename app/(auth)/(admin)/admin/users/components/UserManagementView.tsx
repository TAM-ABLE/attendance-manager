"use client"

import { useState } from "react"
import { SuccessDialog } from "@/components/SuccessDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/types/Attendance"
import { useUsers } from "../hooks/useUsers"
import { CreateUserDialog } from "./CreateUserDialog"
import { EditUserDialog } from "./EditUserDialog"
import { type EmailAction, EmailActionConfirmDialog } from "./EmailActionConfirmDialog"
import { UserTable } from "./UserTable"

type UserManagementViewProps = {
  initialUsers?: User[]
}

export function UserManagementView({ initialUsers }: UserManagementViewProps) {
  const { users, refetch } = useUsers(initialUsers)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [emailAction, setEmailAction] = useState<EmailAction | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">ユーザー一覧</CardTitle>
            <CardDescription className="text-xs sm:text-sm">登録済みユーザーの管理</CardDescription>
          </div>
          <CreateUserDialog onCreated={refetch} />
        </CardHeader>
        <CardContent>
          <UserTable users={users} onEdit={setEditTarget} onEmailAction={setEmailAction} />
        </CardContent>
      </Card>

      <EditUserDialog target={editTarget} onClose={() => setEditTarget(null)} onUpdated={refetch} />

      <EmailActionConfirmDialog
        action={emailAction}
        onClose={() => setEmailAction(null)}
        onSuccess={setActionSuccessMessage}
      />

      <SuccessDialog
        open={!!actionSuccessMessage}
        description={actionSuccessMessage ?? ""}
        onClose={() => setActionSuccessMessage(null)}
      />
    </div>
  )
}
