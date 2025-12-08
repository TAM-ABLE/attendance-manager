// ClockInDialog.tsx
"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { Loader } from "@/components/Loader";
import { SuccessDialog } from "@/components/SuccessDialog";
import { Task } from "../../../../shared/types/Attendance";

export const ClockInDialog = ({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (tasks: Task[]) => Promise<void>; }) => {

    const [plannedTasks, setPlannedTasks] = useState<{ task: string, hours: string }[]>([
        { task: "", hours: "" },
    ]);
    const [mode, setMode] = useState<"form" | "loading" | "success">("form");

    const handleSubmit = async () => {
        try {
            setMode("loading");
            await onSubmit(plannedTasks);
            setMode("success");
        } catch (e) {
            console.error(e);
            setMode("form");
        }
    };

    const handleCloseSuccess = () => {
        onClose();
        setPlannedTasks([{ task: "", hours: "" }]);
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
        return (
            <SuccessDialog
                open={open}
                onClose={handleCloseSuccess}
            />
        );
    }

    // --- Form UI ---
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle>出勤登録</DialogTitle>
                    <DialogDescription>本日の予定を入力してください</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <Label className="text-base">実施予定タスクと予定工数（時間）</Label>
                        <div className="space-y-3 mt-3">
                            {plannedTasks.map((task, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="タスク名"
                                            value={task.task}
                                            onChange={(e) => {
                                                const newList = [...plannedTasks];
                                                newList[index].task = e.target.value;
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
                                onClick={() => setPlannedTasks([...plannedTasks, { task: "", hours: "" }])}
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