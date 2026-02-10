// hooks/useDialogState.ts
// ダイアログ状態管理の共通フック

"use client"

import { useCallback, useState } from "react"
import type { ApiResult } from "@/types/ApiResponse"

/**
 * ダイアログの状態
 */
export type DialogMode = "form" | "loading" | "success"

/**
 * useDialogStateの戻り値
 */
export interface UseDialogStateReturn {
  mode: DialogMode
  error: string | null
  setMode: (mode: DialogMode) => void
  setError: (error: string | null) => void
  handleSubmit: <T>(submitFn: () => Promise<ApiResult<T>>) => Promise<boolean>
  reset: () => void
}

/**
 * ダイアログの状態管理を共通化するフック
 *
 * @example
 * const { mode, error, handleSubmit, reset } = useDialogState();
 *
 * const onSubmit = async () => {
 *   const success = await handleSubmit(() => clockIn(tasks));
 *   if (success) {
 *     // 成功時の処理
 *   }
 * };
 */
export function useDialogState(): UseDialogStateReturn {
  const [mode, setMode] = useState<DialogMode>("form")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async <T>(submitFn: () => Promise<ApiResult<T>>): Promise<boolean> => {
      try {
        setMode("loading")
        setError(null)
        const result = await submitFn()

        if (result.success) {
          setMode("success")
          return true
        }
        setError(result.error.message)
        setMode("form")
        return false
      } catch (e) {
        console.error(e)
        setError(e instanceof Error ? e.message : "Unknown error")
        setMode("form")
        return false
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setMode("form")
    setError(null)
  }, [])

  return {
    mode,
    error,
    setMode,
    setError,
    handleSubmit,
    reset,
  }
}
