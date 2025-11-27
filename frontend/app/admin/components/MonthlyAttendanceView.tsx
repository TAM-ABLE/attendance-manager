"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { UserMonthlyAttendance } from "./UserMonthlyAttendance";
//import { EditAttendanceDialog } from "./EditAttendanceDialog";
//import { exportUserMonthlyCSV } from "@/lib/csv";
import { User, DayAttendance } from "../../../../shared/types/Attendance"

export function MonthlyAttendanceView() {

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthData, setMonthData] = useState<DayAttendance[] | null>(null);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // ユーザー取得
    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch(`/api/attendance/users`);
                const usersData: User[] = await res.json();
                setUsers(usersData);
                if (usersData.length > 0) {
                    setSelectedUser(usersData[0]);
                }
            } catch (err) {
                console.error("ユーザー取得エラー:", err);
            }
        }
        fetchUsers();
    }, []);

    // 月データ取得
    useEffect(() => {
        if (!selectedUser) return;

        async function fetchMonthData() {
            try {
                const res = await fetch(
                    `/api/attendance/user-month?userId=${selectedUser?.id}&year=${year}&month=${month}`
                );
                const data: DayAttendance[] = await res.json();
                setMonthData(data);
            } catch (err) {
                console.error("月データ取得エラー:", err);
                setMonthData(null);
            }
        }
        fetchMonthData();
    }, [selectedUser, year, month]);

    const goToPreviousMonth = () =>
        setCurrentMonth((prev) => {
            const d = new Date(prev);
            d.setMonth(prev.getMonth() - 1);
            return d;
        });

    const goToNextMonth = () =>
        setCurrentMonth((prev) => {
            const d = new Date(prev);
            d.setMonth(prev.getMonth() + 1);
            return d;
        });

    const goToCurrentMonth = () => setCurrentMonth(new Date());

    const handleUserChange = (employeeId: string) => {
        const user = users?.find((u) => u.employeeId === employeeId);
        if (user) setSelectedUser(user);
    };

    const openEditDialog = () => {
        console.log("ダイアログを開く");
    };

    return (
        <div className="space-y-6">
            {/* 月移動＆ユーザー選択 */}
            <Card>
                <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            今月
                        </Button>

                        <Button variant="outline" size="sm" onClick={goToNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        <span className="ml-2 text-lg font-semibold">
                            {year}年{month + 1}月
                        </span>
                    </div>

                    {/* 個人のみ選択 */}
                    <Select value={selectedUser?.employeeId} onValueChange={handleUserChange}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="ユーザーを選択" />
                        </SelectTrigger>

                        <SelectContent>
                            {users?.map((u) => (
                                <SelectItem key={u.employeeId} value={u.employeeId}>
                                    {u.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* 勤怠表示（1ユーザー） */}
            {monthData && selectedUser && (
                <UserMonthlyAttendance
                    user={selectedUser}
                    monthData={monthData}
                    openEditDialog={openEditDialog}
                    exportCSV={() => console.log("エクスポート出力")}
                />
            )}

            {/* 編集ダイアログ */}
            {/*<EditAttendanceDialog />*/}
        </div>
    );
}