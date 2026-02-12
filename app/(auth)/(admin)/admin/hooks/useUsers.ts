// app/admin/hooks/useUsers.ts
"use client"

import { useCallback } from "react"
import { useUserSelect } from "@/hooks/useUserSelect"
import { getUsers } from "@/lib/api-services/admin"
import { withRetry } from "@/lib/auth/with-retry"
import type { User } from "@/types/Attendance"

export function useUsers(initialData?: User[], excludeAdmin = false) {
  const fetchFn = useCallback(async () => {
    const result = await withRetry(getUsers)
    if (result.success && excludeAdmin) {
      return { ...result, data: result.data.filter((u) => u.role !== "admin") }
    }
    return result
  }, [excludeAdmin])
  return useUserSelect<User>({ fetchFn, initialData })
}
