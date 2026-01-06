"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogWrapper } from "@/components/DialogWrapper";
import { useDialogState } from "@/hooks/useDialogState";
import type { ApiResult } from "@attendance-manager/shared/types/ApiResponse";

interface BreakDialogProps {
    open: boolean;
    mode: "start" | "end";
    onClose: () => void;
    onStart: (breakStartTime?: string) => Promise<ApiResult<unknown>>;
    onEnd: (breakEndTime?: string) => Promise<ApiResult<unknown>>;
}

// 現在時刻をHH:mm形式で取得
function getCurrentTimeString(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// HH:mm形式の時間をISO文字列に変換（今日の日付で）
function timeToISOString(time: string): string {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
}

export const BreakDialog = ({ open, mode, onClose, onStart, onEnd }: BreakDialogProps) => {
    const [breakTime, setBreakTime] = useState(getCurrentTimeString());
    const { mode: dialogMode, error, handleSubmit, reset } = useDialogState();

    // ダイアログが開いたときに現在時刻をセット
    useEffect(() => {
        if (open) {
            setBreakTime(getCurrentTimeString());
        }
    }, [open]);

    const onFormSubmit = async () => {
        const isoTime = timeToISOString(breakTime);
        await handleSubmit(() => (mode === "start" ? onStart(isoTime) : onEnd(isoTime)));
    };

    const handleClose = () => {
        reset();
        setBreakTime(getCurrentTimeString());
        onClose();
    };

    return (
        <DialogWrapper open={open} onClose={handleClose} mode={dialogMode} onReset={reset}>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === "start" ? "休憩開始" : "休憩終了"}
                        </DialogTitle>
                    </DialogHeader>

                    {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="breakTime">
                                {mode === "start" ? "休憩開始時間" : "休憩終了時間"}
                            </Label>
                            <Input
                                id="breakTime"
                                type="time"
                                value={breakTime}
                                onChange={(e) => setBreakTime(e.target.value)}
                                className="w-32"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={onFormSubmit}>
                            {mode === "start" ? "開始" : "終了"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DialogWrapper>
    );
};
