// hooks/useUsers.ts
"use client";

import { useEffect, useState } from "react";
import { User } from "../../../../shared/types/Attendance";

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        async function fetchUsers() {
            const res = await fetch(`/api/attendance/users`);
            const usersData: User[] = await res.json();
            if (Array.isArray(usersData)) {
                setUsers(usersData);
                if (usersData.length > 0) {
                    setSelectedUser(usersData[0]);
                }
            } else {
                console.error("users API is not returning an array:", usersData);
                setUsers([]); // fallback
            }
        }
        fetchUsers();
    }, []);

    return { users, selectedUser, setSelectedUser };
}
