// hooks/useUserSelect.ts
// 汎用ユーザー選択hook（SWR対応）
"use client"

import { useCallback, useEffect, useState } from "react"
import useSWR from "swr"

interface UseUserSelectOptions<T> {
  key: string | readonly unknown[] | null
  fetcher: () => Promise<T[]>
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
 * @param key - SWRキャッシュキー
 * @param fetcher - ユーザー一覧を取得する関数（T[]を返す）
 * @param initialData - SSCで取得した初期データ（省略可）
 */
export function useUserSelect<T extends { id: string }>({
  key,
  fetcher,
  initialData,
}: UseUserSelectOptions<T>): UseUserSelectReturn<T> {
  const [selectedUser, setSelectedUser] = useState<T | null>(initialData?.[0] ?? null)

  const {
    data: users = [],
    isLoading,
    error,
    mutate,
  } = useSWR(key, fetcher, {
    fallbackData: initialData,
    revalidateOnMount: !initialData,
  })

  // データロード完了時に未選択なら先頭を自動選択
  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0])
    }
  }, [users, selectedUser])

  const refetch = useCallback(async () => {
    await mutate()
  }, [mutate])

  return {
    users,
    selectedUser,
    setSelectedUser,
    isLoading,
    error: error?.message ?? null,
    refetch,
  }
}
