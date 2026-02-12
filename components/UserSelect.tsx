"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserLike {
  id: string
  name: string
  employeeNumber: string
}

type UserSelectProps<T extends UserLike> = {
  users: T[]
  value: T | null
  onChange: (user: T) => void
  disabled?: boolean
  placeholder?: string
}

export function UserSelect<T extends UserLike>({
  users,
  value,
  onChange,
  disabled,
  placeholder = "ユーザーを選択",
}: UserSelectProps<T>) {
  return (
    <Select
      value={value?.id}
      onValueChange={(id) => {
        const user = users.find((u) => u.id === id)
        if (user) onChange(user)
      }}
      disabled={disabled}
    >
      <SelectTrigger className="flex-1 sm:flex-none sm:w-48">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {users.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.employeeNumber} - {u.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
