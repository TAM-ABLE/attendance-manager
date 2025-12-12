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
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-white">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base">{user.name}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <div className="text-center">
                            <p className="text-muted-foreground">出勤日数</p>
                            <p className="text-xl">{workMonthDays}日</p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground">総勤務時間</p>
                            <p className="text-xl">{formatDurationMs(totalMonthHours)}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>日付</TableHead>
                                <TableHead>曜日</TableHead>
                                <TableHead>出勤①</TableHead>
                                <TableHead>退勤①</TableHead>
                                <TableHead>出勤②</TableHead>
                                <TableHead>退勤②</TableHead>
                                <TableHead>出勤③</TableHead>
                                <TableHead>退勤③</TableHead>
                                <TableHead>休憩合計</TableHead>
                                <TableHead>合計勤務時間</TableHead>
                                <TableHead>編集</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthData.map(dayData => {
                                return (
                                    <TableRow key={dayData.dateLabel} className={''}>
                                        <TableCell>{dayData.dateLabel}</TableCell>
                                        <TableCell className={''}>{dayData.weekday}</TableCell>
                                        <TableCell>{dayData.session1ClockIn != null ? formatClockTime(dayData.session1ClockIn) : '-'}</TableCell>
                                        <TableCell>{dayData.session1ClockOut != null ? formatClockTime(dayData.session1ClockOut) : '-'}</TableCell>
                                        <TableCell>{dayData.session2ClockIn != null ? formatClockTime(dayData.session2ClockIn) : '-'}</TableCell>
                                        <TableCell>{dayData.session2ClockOut != null ? formatClockTime(dayData.session2ClockOut) : '-'}</TableCell>
                                        <TableCell>{dayData.session3ClockIn != null ? formatClockTime(dayData.session3ClockIn) : '-'}</TableCell>
                                        <TableCell>{dayData.session3ClockOut != null ? formatClockTime(dayData.session3ClockOut) : '-'}</TableCell>
                                        <TableCell>{dayData.hasData ? formatDurationMsToHM(dayData.breakTotalHours) : '-'}</TableCell>
                                        <TableCell>{dayData.hasData ? formatDurationMsToHM(dayData.workTotalHours) : '-'}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => openEditDialog(dayData.date)}>
                                                <Edit className="h-4 w-4 mr-2" />編集
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