// app/admin/hooks/useUsers.ts
"use client"

import { useCallback } from "react"
import { useUserSelect } from "@/hooks/useUserSelect"
import { getUsers } from "@/lib/api-services/admin"
import { withRetry } from "@/lib/auth/with-retry"
import type { User } from "@/types/Attendance"

export function useUsers(initialData?: User[]) {
  const fetchFn = useCallback(() => withRetry(getUsers), [])
  return useUserSelect<User>({ fetchFn, initialData })
}
