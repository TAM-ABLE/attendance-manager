"use client"

import { useMemo, useState } from "react"
import { createUser } from "@/lib/api-services/admin"

type CreateUserForm = {
  name: string
  email: string
  password: string
}

export function usePasswordStrength(password: string) {
  return useMemo(() => {
    const checks = {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    }
    const isValid = checks.minLength && checks.hasLetter && checks.hasNumber
    return { checks, isValid }
  }, [password])
}

export function useCreateUser(onSuccess: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{
    name: string
    email: string
    employeeNumber: string
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
