// ClockInDialog.tsx
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { Loader } from "@/components/Loader";
import { SuccessDialog } from "@/components/SuccessDialog";
import type { Task } from "../../../../shared/types/Attendance";
import type { ApiResult } from "../../../../shared/types/ApiResponse";

// UI用のフォーム状態
interface TaskFormItem {
    taskName: string;
    hours: string;
}

// フォーム状態をTask型に変換
function toTasks(items: TaskFormItem[]): Task[] {
    return items
        .filter((item) => item.taskName.trim() !== "")
        .map((item) => ({
            taskName: item.taskName.trim(),
            hours: item.hours ? parseFloat(item.hours) : null,
        }));
}

interface ClockInDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (tasks: Task[]) => Promise<ApiResult<unknown>>;
}

export const ClockInDialog = ({ open, onClose, onSubmit }: ClockInDialogProps) => {
    const [plannedTasks, setPlannedTasks] = useState<TaskFormItem[]>([{ taskName: "", hours: "" }]);
    const [mode, setMode] = useState<"form" | "loading" | "success">("form");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            setMode("loading");
            setError(null);
            const result = await onSubmit(toTasks(plannedTasks));

            if (result.success) {
                setMode("success");
            } else {
                setError(result.error.message);
                setMode("form");
            }
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Unknown error");
            setMode("form");
        }
    };

    const handleCloseSuccess = () => {
        onClose();
        setPlannedTasks([{ taskName: "", hours: "" }]);
        setMode("form");
    };

    // --- Loading UI ---
    if (mode === "loading") {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="flex justify-center py-12">
                    <Loader size={50} border={4} />
                </DialogContent>
            </Dialog>
        );
    }

    // --- Success UI ---
    if (mode === "success") {
        return <SuccessDialog open={open} onClose={handleCloseSuccess} />;
    }

    // --- Form UI ---
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle>出勤登録</DialogTitle>
                    <DialogDescription>本日の予定を入力してください</DialogDescription>
                </DialogHeader>

                {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

                <div className="space-y-4 py-4">
                    <div>
                        <Label className="text-base">実施予定タスクと予定工数（時間）</Label>
                        <div className="space-y-3 mt-3">
                            {plannedTasks.map((task, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="タスク名"
                                            value={task.taskName}
                                            onChange={(e) => {
                                                const newList = [...plannedTasks];
                                                newList[index].taskName = e.target.value;
                                                setPlannedTasks(newList);
                                            }}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <Input
                                            placeholder="1時間"
                                            value={task.hours}
                                            onChange={(e) => {
                                                const newList = [...plannedTasks];
                                                newList[index].hours = e.target.value;
                                                setPlannedTasks(newList);
                                            }}
                                        />
                                    </div>
                                    {plannedTasks.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                setPlannedTasks(plannedTasks.filter((_, i) => i !== index))
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPlannedTasks([...plannedTasks, { taskName: "", hours: "" }])
                                }
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                タスクを追加
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit}>送信</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
