// frontend/app/admin/hooks/useUsers.ts
"use client"

import { useUserSelect } from "@/hooks/useUserSelect"
import { apiClient } from "@/lib/api-client"
import { withRetry } from "@/lib/auth/with-retry"
import type { User } from "@attendance-manager/shared/types/Attendance"
import { useCallback } from "react"

function getUsers() {
  return apiClient<User[]>("/admin/users")
}

export function useUsers() {
  const fetchFn = useCallback(() => withRetry(getUsers), [])
  return useUserSelect<User>({ fetchFn })
}
