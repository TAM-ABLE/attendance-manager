"use client"

import { useState } from "react"
import type { ApiResult } from "@/types/ApiResponse"

export function useAsyncAction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const run = async <T>(fn: () => Promise<ApiResult<T>>): Promise<ApiResult<T>> => {
    setLoading(true)
    setError(null)
    const result = await fn()
    if (!result.success) {
      setError(result.error.message)
    }
    setLoading(false)
    return result
  }

  return { loading, error, clearError, run }
}
