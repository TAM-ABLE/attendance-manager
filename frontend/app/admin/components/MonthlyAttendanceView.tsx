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
import { EditAttendanceDialog } from "./EditAttendanceDialog";
import { User, DayAttendance, WorkSession } from "../../../../shared/types/Attendance";

export function MonthlyAttendanceView() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthData, setMonthData] = useState<DayAttendance[] | null>(null);

    // 編集用
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedEdittingDate, setSelectedEdittingDate] = useState<string | null>(null);
    const [edittingWorkSessions, setEdittingWorkSessions] = useState<WorkSession[]>([]);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // ユーザー取得
    useEffect(() => {
        async function fetchUsers() {
            const res = await fetch(`/api/attendance/users`);
            const usersData: User[] = await res.json();
            setUsers(usersData);

            if (usersData.length > 0) {
                setSelectedUser(usersData[0]);
            }
        }
        fetchUsers();
    }, []);

    // 月データ取得
    useEffect(() => {
        if (!selectedUser) return;

        async function fetchMonthData() {
            const res = await fetch(
                `/api/attendance/user-month?userId=${selectedUser?.id}&year=${year}&month=${month}`
            );
            const data: DayAttendance[] = await res.json();
            setMonthData(data);
        }

        fetchMonthData();
    }, [selectedUser, year, month]);

    // ダイアログを開く（date を yyyy-mm-dd 形式で受け取る
    const openEditDialog = async (date: string) => {
        setSelectedEdittingDate(date);

        // --- 対象日のセッションをロード ---
        const res = await fetch(
            `/api/attendance/get-user-date-work-sessions?userId=${selectedUser?.id}&date=${date}`
        );
        const data: WorkSession[] = await res.json(); //なくてもから配列で帰ってくる

        setEdittingWorkSessions(data);
        setShowEditDialog(true);
    };

    const closeDialog = () => setShowEditDialog(false);

    // 保存処理（sessions のみ送る）
    const handleSubmitEdit = async () => {
        await fetch("/api/attendance/update-user-date-work-sessions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: selectedUser?.id,
                date: selectedEdittingDate,
                sessions: edittingWorkSessions,
            }),
        });

        // 月データを再読み込み
        if (selectedUser) {
            const res = await fetch(
                `/api/attendance/user-month?userId=${selectedUser.id}&year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth()}`
            );
            const data: DayAttendance[] = await res.json();
            setMonthData(data);
        }

        setShowEditDialog(false);
    };

    return (
        <div className="space-y-6">
            {/* 月移動＆ユーザー選択 */}
            <Card>
                <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => {
                            const d = new Date(prev);
                            d.setMonth(prev.getMonth() - 1);
                            return d;
                        })}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            今月
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => {
                            const d = new Date(prev);
                            d.setMonth(prev.getMonth() + 1);
                            return d;
                        })}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        <span className="ml-2 text-lg font-semibold">
                            {year}年{month + 1}月
                        </span>
                    </div>

                    {/* 個人選択 */}
                    <Select
                        value={selectedUser?.employeeId}
                        onValueChange={(employeeId) => {
                            const user = users.find((u) => u.employeeId === employeeId);
                            if (user) setSelectedUser(user);
                        }}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="ユーザーを選択" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((u) => (
                                <SelectItem key={u.employeeId} value={u.employeeId}>
                                    {u.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* 勤怠表示 */}
            {monthData && selectedUser && (
                <UserMonthlyAttendance
                    user={selectedUser}
                    monthData={monthData}
                    openEditDialog={openEditDialog}
                    exportCSV={() => console.log("エクスポート")}
                />
            )}

            {/* 編集ダイアログ */}
            <EditAttendanceDialog
                open={showEditDialog}
                date={selectedEdittingDate}
                onClose={closeDialog}
                onSave={handleSubmitEdit}
                sessions={edittingWorkSessions ?? []}
                setSessions={setEdittingWorkSessions}
            />
        </div>
    );
}
