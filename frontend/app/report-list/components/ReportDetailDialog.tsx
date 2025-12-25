"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DailyReport } from "../../../../shared/types/DailyReport";
import { getDailyReportDetail } from "@/app/actions/daily-reports";

interface ReportDetailDialogProps {
    open: boolean;
    reportId: string | null;
    onClose: () => void;
}

function getStatusDisplay(submittedAt: number | null): { label: string; variant: "default" | "secondary" } {
    return submittedAt !== null
        ? { label: "提出済", variant: "default" }
        : { label: "下書き", variant: "secondary" };
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 (${weekday})`;
}

export function ReportDetailDialog({ open, reportId, onClose }: ReportDetailDialogProps) {
    const [report, setReport] = useState<DailyReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && reportId) {
            const fetchReport = async () => {
                setIsLoading(true);
                try {
                    const result = await getDailyReportDetail(reportId);
                    if (result.success) {
                        setReport(result.data);
                    } else {
                        console.error("Failed to fetch report detail:", result.error.message);
                        setReport(null);
                    }
                } catch (err) {
                    console.error("Failed to fetch report detail:", err);
                    setReport(null);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchReport();
        } else {
            setReport(null);
        }
    }, [open, reportId]);

    const status = report ? getStatusDisplay(report.submittedAt) : null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        日報詳細
                        {status && (
                            <Badge variant={status.variant} className="text-xs">
                                {status.label}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {isLoading && (
                    <div className="py-8 text-center text-muted-foreground">
                        読み込み中...
                    </div>
                )}

                {!isLoading && !report && (
                    <div className="py-8 text-center text-muted-foreground">
                        日報が見つかりません
                    </div>
                )}

                {!isLoading && report && (
                    <div className="space-y-4">
                        {/* 日付 */}
                        <div className="text-lg font-semibold">
                            {formatDate(report.date)}
                        </div>

                        <div className="border-t my-2" />

                        {/* 予定タスク */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    予定タスク ({report.plannedTasks.length}件)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {report.plannedTasks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">なし</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {report.plannedTasks.map((task) => (
                                            <li key={task.id} className="text-sm flex justify-between">
                                                <span>{task.taskName}</span>
                                                {task.hours && (
                                                    <span className="text-muted-foreground">
                                                        {task.hours}h
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* 実績タスク */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    実績タスク ({report.actualTasks.length}件)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {report.actualTasks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">なし</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {report.actualTasks.map((task) => (
                                            <li key={task.id} className="text-sm flex justify-between">
                                                <span>{task.taskName}</span>
                                                {task.hours && (
                                                    <span className="text-muted-foreground">
                                                        {task.hours}h
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* まとめ・所感 */}
                        {report.summary && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">まとめ・所感</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{report.summary}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* 困っていること */}
                        {report.issues && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">困っていること</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{report.issues}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* 連絡事項 */}
                        {report.notes && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">連絡事項</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
