// hooks/useUsers.ts
"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
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

    // users が取得されたら最初のユーザーを返すメモ化値
    const firstUser = useMemo(() => {
        if (!users || users.length === 0) return null;
        return users[0];
    }, [users]);

    // selectedUser の初期値は users[0]
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // 初回だけ firstUser があるならセット
    if (selectedUser === null && firstUser !== null) {
        setSelectedUser(firstUser);
    }

    return {
        users: users || [],
        selectedUser,
        setSelectedUser,
        isLoading,
        error,
    };
}
