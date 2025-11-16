// ClockOutDialog.tsx
"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";

export const ClockOutDialog = ({
    open,
    onClose,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
        name: string;
        actualTasks: { task: string; hours: string }[];
        summary: string;
        issues: string;
        notes: string;
    }) => void;
}) => {
    const { data: session } = useSession();
    const name = session?.user?.name || "不明なユーザー";

    const [actualTasks, setActualTasks] = useState([{ task: "", hours: "" }]);
    const [summary, setSummary] = useState("");
    const [issues, setIssues] = useState("");
    const [notes, setNotes] = useState("");

    const handleSubmit = () => {
        onSubmit({
            name,
            actualTasks,
            summary,
            issues,
            notes,
        });

        setActualTasks([{ task: "", hours: "" }]);
        setSummary("");
        setIssues("");
        setNotes("");

        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle>退勤登録</DialogTitle>
                    <DialogDescription>本日の業務報告を入力してください</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <Label className="text-base">実施タスクと実工数（時間）</Label>
                        <div className="space-y-3 mt-3">
                            {actualTasks.map((task, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="タスク名"
                                            value={task.task}
                                            onChange={(e) => {
                                                const newList = [...actualTasks];
                                                newList[index].task = e.target.value;
                                                setActualTasks(newList);
                                            }}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <Input
                                            placeholder="時間"
                                            value={task.hours}
                                            onChange={(e) => {
                                                const newList = [...actualTasks];
                                                newList[index].hours = e.target.value;
                                                setActualTasks(newList);
                                            }}
                                        />
                                    </div>
                                    {actualTasks.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                setActualTasks(actualTasks.filter((_, i) => i !== index))
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
                                onClick={() => setActualTasks([...actualTasks, { task: "", hours: "" }])}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                タスクを追加
                            </Button>
                        </div>
                    </div>

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
                    <Button variant="outline" onClick={onClose}>戻る</Button>
                    <Button onClick={handleSubmit}>送信</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};