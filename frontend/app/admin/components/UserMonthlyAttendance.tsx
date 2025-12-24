// components/admin/UserMonthlyAttendance.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { formatClockTime, formatDurationMs, formatDurationMsToHM, getWeekdayLabel, getDateLabel } from "@/lib/time";
import { AttendanceRecord, User } from "../../../../shared/types/Attendance";

interface Props {
    user: User;
    monthData: AttendanceRecord[];
    openEditDialog: (date: string) => void;
}

export const UserMonthlyAttendance = ({ user, monthData, openEditDialog }: Props) => {
    const workMonthDays = monthData.filter(d => d.sessions.length > 0).length;
    const totalMonthHours = monthData.reduce((acc, d) => acc + d.workTotalMs, 0);

    const getInitials = (name: string) => name.slice(0, 2);

    return (
        <Card>
            <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-white">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base">{user.name}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-4 text-sm justify-end">
                        <div className="text-center">
                            <p className="text-muted-foreground text-xs sm:text-sm">出勤日数</p>
                            <p className="text-lg sm:text-xl">{workMonthDays}日</p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground text-xs sm:text-sm">総勤務時間</p>
                            <p className="text-lg sm:text-xl">{formatDurationMs(totalMonthHours)}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <Table className="text-xs sm:text-sm min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap">日付</TableHead>
                                <TableHead className="whitespace-nowrap">曜日</TableHead>
                                <TableHead className="whitespace-nowrap">セッション</TableHead>
                                <TableHead className="whitespace-nowrap">休憩</TableHead>
                                <TableHead className="whitespace-nowrap">合計</TableHead>
                                <TableHead className="whitespace-nowrap"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthData.map(dayData => {
                                const hasData = dayData.sessions.length > 0;
                                const dateLabel = getDateLabel(dayData.date);
                                const weekday = getWeekdayLabel(dayData.date);

                                // セッションの出退勤時間を表示用にフォーマット
                                const sessionsDisplay = dayData.sessions.map((s, i) => (
                                    <div key={s.id} className="text-xs">
                                        {i + 1}. {formatClockTime(s.clockIn ?? undefined)} - {formatClockTime(s.clockOut ?? undefined)}
                                    </div>
                                ));

                                return (
                                    <TableRow key={dayData.date}>
                                        <TableCell className="whitespace-nowrap">{dateLabel}</TableCell>
                                        <TableCell className="whitespace-nowrap">{weekday}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {hasData ? sessionsDisplay : '-'}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{hasData ? formatDurationMsToHM(dayData.breakTotalMs) : '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap">{hasData ? formatDurationMsToHM(dayData.workTotalMs) : '-'}</TableCell>
                                        <TableCell>
                                            <Button size="sm" className="h-7 px-2 sm:px-3 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => openEditDialog(dayData.date)}>
                                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                                <span className="hidden sm:inline">編集</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};
