// hooks/useUserSelect.ts
// 汎用ユーザー選択hook
"use client"

import { useCallback, useEffect, useState } from "react"
import type { ApiResult } from "@/types/ApiResponse"

interface UseUserSelectOptions<T> {
  fetchFn: () => Promise<ApiResult<T[]>>
  initialData?: T[]
}

interface UseUserSelectReturn<T> {
  users: T[]
  selectedUser: T | null
  setSelectedUser: (user: T | null) => void
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * ユーザー一覧を取得し、選択状態を管理する汎用hook
 * @param fetchFn - ユーザー一覧を取得する関数（ApiResult<T[]>を返す）
 * @param initialData - SSCで取得した初期データ（省略可）
 */
export function useUserSelect<T extends { id: string }>({
  fetchFn,
  initialData,
}: UseUserSelectOptions<T>): UseUserSelectReturn<T> {
  const [users, setUsers] = useState<T[]>(initialData ?? [])
  const [selectedUser, setSelectedUser] = useState<T | null>(initialData?.[0] ?? null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchFn()

      if (result.success) {
        setUsers(result.data)
        // 初回のみ自動選択
        if (result.data.length > 0 && !selectedUser) {
          setSelectedUser(result.data[0])
        }
      } else {
        setError(result.error.message)
        setUsers([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn, selectedUser])

  useEffect(() => {
    // 初期データがある場合はfetchをスキップ
    if (initialData) {
      return
    }

    let mounted = true

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await fetchFn()

        if (mounted) {
          if (result.success) {
            setUsers(result.data)
            if (result.data.length > 0) {
              setSelectedUser(result.data[0])
            }
          } else {
            setError(result.error.message)
            setUsers([])
          }
        }
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : String(err)
          setError(message)
          setUsers([])
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [fetchFn, initialData])

  return {
    users,
    selectedUser,
    setSelectedUser,
    isLoading,
    error,
    refetch: fetchUsers,
  }
}
