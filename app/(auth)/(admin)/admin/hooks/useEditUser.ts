"use client"

import { useState } from "react"
import { updateUser } from "@/lib/api-services/admin"

type EditUserForm = {
  lastName: string
  firstName: string
  email: string
}

export function useEditUser(onSuccess: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (userId: string, form: EditUserForm) => {
    setLoading(true)
    setError(null)

    const result = await updateUser(userId, form)

    if (result.success) {
      onSuccess()
    } else {
      setError(result.error.message)
    }

    setLoading(false)
    return result.success
  }

  const clearError = () => setError(null)

  return { submit, loading, error, clearError }
}
