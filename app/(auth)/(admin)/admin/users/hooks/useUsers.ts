// app/admin/hooks/useUsers.ts
"use client"

import { useUserSelect } from "@/hooks/useUserSelect"
import { getUsers } from "@/lib/api-services/admin"
import { withRetryFetcher } from "@/lib/auth/with-retry"
import { SWR_KEYS } from "@/lib/swr-keys"
import type { User } from "@/types/Attendance"

export function useUsers(initialData?: User[], excludeAdmin = false) {
  return useUserSelect<User>({
    key: SWR_KEYS.adminUsers(excludeAdmin),
    fetcher: async () => {
      const users = await withRetryFetcher(getUsers)
      return excludeAdmin ? users.filter((u) => u.role !== "admin") : users
    },
    initialData,
  })
}
