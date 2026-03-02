"use client"

import { useState } from "react"
import type { User } from "@/types/Attendance"

export type UserFormState = {
  lastName: string
  firstName: string
  email: string
}

const emptyForm: UserFormState = { lastName: "", firstName: "", email: "" }

export function useUserFormDialog() {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<User | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm)

  const openDialog = (user: User) => {
    const [last, ...rest] = user.name.split(" ")
    setForm({ lastName: last, firstName: rest.join(" "), email: user.email })
    setTarget(user)
    setOpen(true)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setTarget(null)
      setForm(emptyForm)
    }
  }

  const updateField = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return { open, target, form, updateField, openDialog, handleOpenChange }
}
