// components/admin/UserMonthlyAttendance.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { formatClockTime, formatDurationMs, formatDurationMsToHM } from "@/lib/time";
import { DayAttendance, User } from "../../../../shared/types/Attendance";

interface Props {
    user: User;
    monthData: DayAttendance[];
    openEditDialog: (date: string) => void;
}

export const UserMonthlyAttendance = ({ user, monthData, openEditDialog }: Props) => {
    const workMonthDays = monthData.filter(d => d.hasData).length;
    const totalMonthHours = monthData.reduce((acc, d) => acc + d.workTotalHours, 0);

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
                    <Table className="text-xs sm:text-sm min-w-[800px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap">日付</TableHead>
                                <TableHead className="whitespace-nowrap">曜日</TableHead>
                                <TableHead className="whitespace-nowrap">出勤①</TableHead>
                                <TableHead className="whitespace-nowrap">退勤①</TableHead>
                                <TableHead className="whitespace-nowrap">出勤②</TableHead>
                                <TableHead className="whitespace-nowrap">退勤②</TableHead>
                                <TableHead className="whitespace-nowrap">出勤③</TableHead>
                                <TableHead className="whitespace-nowrap">退勤③</TableHead>
                                <TableHead className="whitespace-nowrap">休憩</TableHead>
                                <TableHead className="whitespace-nowrap">合計</TableHead>
                                <TableHead className="whitespace-nowrap"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthData.map(dayData => {
                                return (
                                    <TableRow key={dayData.dateLabel}>
                                        <TableCell className="whitespace-nowrap">{dayData.dateLabel}</TableCell>
                                        <TableCell className="whitespace-nowrap">{dayData.weekday}</TableCell>
                                        <TableCell className="whitespace-nowrap">{dayData.session1ClockIn != null ? formatClockTime(dayData.session1ClockIn) : '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap">{dayData.session1ClockOut != null ? formatClockTime(dayData.session1ClockOut) : '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap">{dayData.session2ClockIn != null ? formatClockTime(dayData.session2ClockIn) : '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap">{dayData.session2ClockOut != null ? formatClockTime(dayData.session2ClockOut) : '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap">{dayData.session3ClockIn != null ? formatClockTime(dayData.session3ClockIn) : '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap">{dayData.session3ClockOut != null ? formatClockTime(dayData.session3ClockOut) : '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap">{dayData.hasData ? formatDurationMsToHM(dayData.breakTotalHours) : '-'}</TableCell>
                                        <TableCell className="whitespace-nowrap">{dayData.hasData ? formatDurationMsToHM(dayData.workTotalHours) : '-'}</TableCell>
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