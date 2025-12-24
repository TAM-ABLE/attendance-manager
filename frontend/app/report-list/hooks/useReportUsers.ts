"use client";

import { useEffect, useState } from "react";
import { UserForSelect } from "../../../../shared/types/DailyReport";
import { getDailyReportUsers } from "@/app/actions/daily-reports";

export function useReportUsers() {
    const [users, setUsers] = useState<UserForSelect[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserForSelect | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const data = await getDailyReportUsers();
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
