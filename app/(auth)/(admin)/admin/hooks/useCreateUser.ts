"use client"

import { useState } from "react"
import { useAsyncAction } from "@/hooks/useAsyncAction"
import { createUser } from "@/lib/api-services/admin"

type CreateUserForm = {
  lastName: string
  firstName: string
  email: string
}

export function useCreateUser(onSuccess: () => void) {
  const { loading, error, clearError, run } = useAsyncAction()
  const [successData, setSuccessData] = useState<{
    name: string
    email: string
    employeeNumber: string
    initialPassword: string
  } | null>(null)

  const submit = async (form: CreateUserForm) => {
    const result = await run(() => createUser(form))

    if (result.success) {
      setSuccessData({
        name: result.data.name,
        email: result.data.email,
        employeeNumber: result.data.employeeNumber,
        initialPassword: result.data.initialPassword,
      })
      onSuccess()
    }

    return result.success
  }

  const clearSuccess = () => setSuccessData(null)

  return { submit, loading, error, successData, clearSuccess, clearError }
}
