"use client";

import { useState } from "react";
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

import { ReportTable } from "./ReportTable";
import { ReportDetailDialog } from "./ReportDetailDialog";
import { useReportUsers } from "../hooks/useReportUsers";
import { useMonthlyReports } from "../hooks/useMonthlyReports";

export function ReportListView() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { users, selectedUser, setSelectedUser, isLoading: usersLoading } = useReportUsers();
    const { reports, isLoading: reportsLoading } = useMonthlyReports(selectedUser, currentMonth);

    // 詳細ダイアログ
    const [detailReportId, setDetailReportId] = useState<string | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);

    const handleViewDetail = (reportId: string) => {
        setDetailReportId(reportId);
        setShowDetailDialog(true);
    };

    const handleCloseDetail = () => {
        setShowDetailDialog(false);
        setDetailReportId(null);
    };

    const handlePrevMonth = () => {
        setCurrentMonth((prev) => {
            const d = new Date(prev);
            d.setMonth(prev.getMonth() - 1);
            return d;
        });
    };

    const handleNextMonth = () => {
        setCurrentMonth((prev) => {
            const d = new Date(prev);
            d.setMonth(prev.getMonth() + 1);
            return d;
        });
    };

    const handleToday = () => {
        setCurrentMonth(new Date());
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* 月移動＆ユーザー選択 */}
            <Card>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* 月移動 */}
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <Button variant="outline" size="sm" onClick={handleToday}>
                                <CalendarIcon className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">今月</span>
                            </Button>

                            <Button variant="outline" size="sm" onClick={handleNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <span className="ml-2 text-base sm:text-lg font-semibold whitespace-nowrap">
                            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                        </span>
                    </div>

                    {/* ユーザー選択 */}
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedUser?.id}
                            onValueChange={(userId) => {
                                const user = users.find((u) => u.id === userId);
                                if (user) setSelectedUser(user);
                            }}
                            disabled={usersLoading}
                        >
                            <SelectTrigger className="flex-1 sm:flex-none sm:w-48">
                                <SelectValue placeholder="ユーザーを選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.employeeNumber} - {u.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 日報一覧 */}
            {selectedUser && (
                <ReportTable
                    reports={reports}
                    isLoading={reportsLoading}
                    onViewDetail={handleViewDetail}
                />
            )}

            {!selectedUser && !usersLoading && (
                <Card>
                    <CardContent className="py-8">
                        <p className="text-center text-muted-foreground">
                            ユーザーを選択してください
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* 詳細ダイアログ */}
            <ReportDetailDialog
                open={showDetailDialog}
                reportId={detailReportId}
                onClose={handleCloseDetail}
            />
        </div>
    );
}
