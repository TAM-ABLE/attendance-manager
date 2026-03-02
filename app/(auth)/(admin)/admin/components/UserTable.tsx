import { Edit, KeyRound, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { User } from "@/types/Attendance"
import type { EmailAction } from "./EmailActionConfirmDialog"

type UserTableProps = {
  users: User[]
  onEdit: (user: User) => void
  onEmailAction: (action: EmailAction) => void
}

export function UserTable({ users, onEdit, onEmailAction }: UserTableProps) {
  return (
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
                    onClick={() => onEdit(user)}
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
                          onEmailAction({
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
                          onEmailAction({
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
  )
}
