"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download } from "lucide-react";
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
import { useUsers } from "../hooks/useUsers";
import { useMonthlyAttendance } from "../hooks/useMonthlyAttendance";
import { useEditDialog } from "../hooks/useEditDialog";
import { exportMonthlyAttendanceCSV } from "@/lib/exportCsv";

export function MonthlyAttendanceView() {

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { users, selectedUser, setSelectedUser } = useUsers();
    const { monthData, setMonthData } = useMonthlyAttendance(selectedUser, currentMonth);

    const reloadMonth = async () => {
        if (!selectedUser) return;
        const res = await fetch(
            `/api/attendance/user-month?userId=${selectedUser.id}&year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth()}`
        );
        setMonthData(await res.json());
    };

    const editDialog = useEditDialog(selectedUser, reloadMonth);

    const handleExportCSV = () => {
        if (!selectedUser) {
            alert("ユーザーが選択されていません。ユーザーを選択してからエクスポートしてください。");
            return;
        }
        if (!monthData) {
            alert("勤怠データが読み込まれていません。しばらく待ってから再度お試しください。");
            return;
        }
        exportMonthlyAttendanceCSV(monthData, selectedUser.name);
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
                            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
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

                        {/* CSVダウンロードボタン */}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleExportCSV}
                            className="border-[#2563EB] text-[#2563EB] bg-white hover:bg-blue-50"
                        >
                            <Download className="h-4 w-4 mr-2" />CSVダウンロード
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 勤怠表示 */}
            {monthData && selectedUser && (
                <UserMonthlyAttendance
                    user={selectedUser}
                    monthData={monthData}
                    openEditDialog={editDialog.openDialog}
                />
            )}

            {/* 編集ダイアログ */}
            <EditAttendanceDialog
                open={editDialog.showEditDialog}
                date={editDialog.selectedDate}
                onClose={editDialog.closeDialog}
                onSave={editDialog.saveSessions}
                sessions={editDialog.sessions}
                setSessions={editDialog.setSessions}
            />
        </div>
    );
}
