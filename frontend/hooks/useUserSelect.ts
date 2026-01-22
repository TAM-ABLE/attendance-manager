// frontend/hooks/useUserSelect.ts
// 汎用ユーザー選択hook
"use client"

import type { ApiResult } from "@attendance-manager/shared/types/ApiResponse"
import { useCallback, useEffect, useState } from "react"

interface UseUserSelectOptions<T> {
  fetchFn: () => Promise<ApiResult<T[]>>
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
 */
export function useUserSelect<T extends { id: string }>({
  fetchFn,
}: UseUserSelectOptions<T>): UseUserSelectReturn<T> {
  const [users, setUsers] = useState<T[]>([])
  const [selectedUser, setSelectedUser] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
  }, [fetchFn])

  return {
    users,
    selectedUser,
    setSelectedUser,
    isLoading,
    error,
    refetch: fetchUsers,
  }
}
