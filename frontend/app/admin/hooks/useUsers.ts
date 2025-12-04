// hooks/useUsers.ts
"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { User } from "../../../../shared/types/Attendance";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUsers() {
    const { data: users, error, isLoading } = useSWR<User[]>(
        "/api/attendance/users",
        fetcher,
        {
            revalidateOnFocus: false,   // 画面に戻ってきた時に再fetchしない
            dedupingInterval: 30 * 60 * 1000, // 30分以内の重複fetchを防ぐ
            refreshInterval: 0,        // 自動ポーリングなし
        }
    );

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // users を受け取ったタイミングで selectedUser を初期化
    useEffect(() => {
        if (users && users.length > 0 && !selectedUser) {
            setSelectedUser(users[0]);
        }
    }, [users]);

    return {
        users: users || [],
        selectedUser,
        setSelectedUser,
        isLoading,
        error,
    };
}
