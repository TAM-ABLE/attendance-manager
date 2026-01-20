// frontend/app/admin/hooks/useUsers.ts
"use client";

import { useCallback } from "react";
import { User } from "@attendance-manager/shared/types/Attendance";
import { apiClient } from "@/lib/api-client";
import { withRetry } from "@/lib/auth/with-retry";
import { useUserSelect } from "@/hooks/useUserSelect";

function getUsers() {
    return apiClient<User[]>("/admin/users");
}

export function useUsers() {
    const fetchFn = useCallback(() => withRetry(getUsers), []);
    return useUserSelect<User>({ fetchFn });
}
