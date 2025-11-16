// ClockInDialog.tsx
"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";

export const ClockInDialog = ({
    open,
    onClose,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
        name: string;
        plannedTasks: { task: string; hours: string }[];
    }) => void;
}) => {
    const { data: session } = useSession();
    const name = session?.user?.name || "不明なユーザー";

    const [plannedTasks, setPlannedTasks] = useState([
        { task: "", hours: "" },
    ]);

    const handleSubmit = () => {
        onSubmit({
            name,
            plannedTasks,
        });
        setPlannedTasks([{ task: "", hours: "" }]);
        onClose();
    };

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
                                            placeholder="時間"
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
                    <Button variant="outline" onClick={onClose}>戻る</Button>
                    <Button onClick={handleSubmit}>送信</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};