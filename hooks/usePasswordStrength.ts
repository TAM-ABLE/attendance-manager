"use client"

import { useMemo } from "react"

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
