// hooks/useUsers.ts
"use client";

import { useEffect, useState } from "react";
import { User } from "../../../../shared/types/Attendance";
import { getUsers } from "@/app/actions/get-users";

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const data = await getUsers();
                setUsers(data);
                if (data.length > 0 && !selectedUser) {
                    setSelectedUser(data[0]);
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        users,
        selectedUser,
        setSelectedUser,
        isLoading,
        error,
    };
}
