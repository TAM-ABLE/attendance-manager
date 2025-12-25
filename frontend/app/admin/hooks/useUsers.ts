// frontend/app/admin/hooks/useUsers.ts
"use client";

import { useCallback } from "react";
import { User } from "../../../../shared/types/Attendance";
import { getUsers } from "@/app/actions/admin";
import { useUserSelect } from "@/hooks/useUserSelect";

export function useUsers() {
    const fetchFn = useCallback(() => getUsers(), []);
    return useUserSelect<User>({ fetchFn });
}
