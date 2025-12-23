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
import { getUserMonth } from "@/app/actions/get-user-month";

export function MonthlyAttendanceView() {

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { users, selectedUser, setSelectedUser } = useUsers();
    const { monthData, setMonthData } = useMonthlyAttendance(selectedUser, currentMonth);

    const reloadMonth = async () => {
        if (!selectedUser) return;
        const data = await getUserMonth(selectedUser.id, currentMonth.getFullYear(), currentMonth.getMonth());
        setMonthData(data);
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
        <div className="space-y-4 sm:space-y-6">
            {/* 月移動＆ユーザー選択 */}
            <Card>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* 月移動 */}
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => {
                                const d = new Date(prev);
                                d.setMonth(prev.getMonth() - 1);
                                return d;
                            })}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                                <CalendarIcon className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">今月</span>
                            </Button>

                            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => {
                                const d = new Date(prev);
                                d.setMonth(prev.getMonth() + 1);
                                return d;
                            })}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <span className="ml-2 text-base sm:text-lg font-semibold whitespace-nowrap">
                            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                        </span>
                    </div>

                    {/* ユーザー選択 & CSV */}
                    <div className="flex items-center gap-2">
                        {/* 個人選択 */}
                        <Select
                            value={selectedUser?.employeeId}
                            onValueChange={(employeeId) => {
                                const user = users.find((u) => u.employeeId === employeeId);
                                if (user) setSelectedUser(user);
                            }}
                        >
                            <SelectTrigger className="flex-1 sm:flex-none sm:w-40">
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
                            size="sm"
                            onClick={handleExportCSV}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                        >
                            <Download className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">CSVダウンロード</span>
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
