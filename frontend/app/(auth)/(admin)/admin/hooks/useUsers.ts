// frontend/app/admin/hooks/useUsers.ts
"use client";

import { useCallback } from "react";
import { User } from "@attendance-manager/shared/types/Attendance";
import { getUsers } from "@/app/actions/admin";
import { withRetry } from "@/lib/auth/with-retry";
import { useUserSelect } from "@/hooks/useUserSelect";

export function useUsers() {
    const fetchFn = useCallback(() => withRetry(getUsers), []);
    return useUserSelect<User>({ fetchFn });
}
