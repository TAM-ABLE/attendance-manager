// ClockOutDialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DialogWrapper } from "@/components/DialogWrapper";
import { TaskListEditor } from "@/components/TaskListEditor";
import { useDialogState } from "@/hooks/useDialogState";
import { toTasks, createInitialTasks, type TaskFormItem } from "@/lib/task-form";
import type { Task } from "../../../../shared/types/Attendance";
import type { ApiResult } from "../../../../shared/types/ApiResponse";

interface ClockOutDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (actualTasks: Task[], summary: string, issues: string, notes: string) => Promise<ApiResult<unknown>>;
}

export const ClockOutDialog = ({ open, onClose, onSubmit }: ClockOutDialogProps) => {
    const [actualTasks, setActualTasks] = useState<TaskFormItem[]>(createInitialTasks());
    const [summary, setSummary] = useState<string>("");
    const [issues, setIssues] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const { mode, error, handleSubmit, reset } = useDialogState();

    const onFormSubmit = async () => {
        await handleSubmit(() => onSubmit(toTasks(actualTasks), summary, issues, notes));
    };

    const handleClose = () => {
        reset();
        setActualTasks(createInitialTasks());
        setSummary("");
        setIssues("");
        setNotes("");
        onClose();
    };

    return (
        <DialogWrapper open={open} onClose={handleClose} mode={mode} onReset={reset}>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>退勤登録</DialogTitle>
                        <DialogDescription>本日の業務報告を入力してください</DialogDescription>
                    </DialogHeader>

                    {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

                    <div className="space-y-4 py-4">
                        <TaskListEditor
                            tasks={actualTasks}
                            onChange={setActualTasks}
                            label="実施タスクと実工数（時間）"
                        />

                        <div>
                            <Label htmlFor="summary">本日のまとめ（感想・気づき）</Label>
                            <Textarea
                                id="summary"
                                placeholder="本日の業務についての感想や気づきを入力..."
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                className="mt-2 min-h-24"
                            />
                        </div>

                        <div>
                            <Label htmlFor="issues">困っていること・相談したいこと</Label>
                            <Textarea
                                id="issues"
                                placeholder="困っていることや相談したいことがあれば入力..."
                                value={issues}
                                onChange={(e) => setIssues(e.target.value)}
                                className="mt-2 min-h-24"
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes">連絡事項</Label>
                            <Textarea
                                id="notes"
                                placeholder="連絡事項があれば入力..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="mt-2 min-h-24"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={onFormSubmit}>送信</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DialogWrapper>
    );
};
