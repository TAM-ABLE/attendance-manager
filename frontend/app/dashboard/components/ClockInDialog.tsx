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
import { Button } from "@/components/ui/button";
import { DialogWrapper } from "@/components/DialogWrapper";
import { TaskListEditor } from "@/components/TaskListEditor";
import { useDialogState } from "@/hooks/useDialogState";
import { toTasks, createInitialTasks, type TaskFormItem } from "@/lib/task-form";
import type { Task } from "@attendance-manager/shared/types/Attendance";
import type { ApiResult } from "@attendance-manager/shared/types/ApiResponse";

interface ClockInDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (tasks: Task[]) => Promise<ApiResult<unknown>>;
}

export const ClockInDialog = ({ open, onClose, onSubmit }: ClockInDialogProps) => {
    const [plannedTasks, setPlannedTasks] = useState<TaskFormItem[]>(createInitialTasks());
    const { mode, error, handleSubmit, reset } = useDialogState();

    const onFormSubmit = async () => {
        await handleSubmit(() => onSubmit(toTasks(plannedTasks)));
    };

    const handleClose = () => {
        reset();
        setPlannedTasks(createInitialTasks());
        onClose();
    };

    return (
        <DialogWrapper open={open} onClose={handleClose} mode={mode} onReset={reset}>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>出勤登録</DialogTitle>
                        <DialogDescription>本日の予定を入力してください</DialogDescription>
                    </DialogHeader>

                    {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

                    <div className="space-y-4 py-4">
                        <TaskListEditor
                            tasks={plannedTasks}
                            onChange={setPlannedTasks}
                            label="実施予定タスクと予定工数（時間）"
                        />
                    </div>

                    <DialogFooter>
                        <Button onClick={onFormSubmit}>送信</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DialogWrapper>
    );
};
