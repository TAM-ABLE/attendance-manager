"use client"

import { useState } from "react"
import { createUser } from "@/lib/api-services/admin"

type CreateUserForm = {
  lastName: string
  firstName: string
  email: string
}

export function useCreateUser(onSuccess: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{
    name: string
    email: string
    employeeNumber: string
    initialPassword: string
  } | null>(null)

  const submit = async (form: CreateUserForm) => {
    setLoading(true)
    setError(null)

    const result = await createUser(form)

    if (result.success) {
      setSuccessData({
        name: result.data.name,
        email: result.data.email,
        employeeNumber: result.data.employeeNumber,
        initialPassword: result.data.initialPassword,
      })
      onSuccess()
    } else {
      setError(result.error.message)
    }

    setLoading(false)
    return result.success
  }

  const clearSuccess = () => setSuccessData(null)
  const clearError = () => setError(null)

  return { submit, loading, error, successData, clearSuccess, clearError }
}
