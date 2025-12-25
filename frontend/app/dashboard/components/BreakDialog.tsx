"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogWrapper } from "@/components/DialogWrapper";
import { useDialogState } from "@/hooks/useDialogState";
import type { ApiResult } from "../../../../shared/types/ApiResponse";

interface BreakDialogProps {
    open: boolean;
    mode: "start" | "end";
    onClose: () => void;
    onStart: () => Promise<ApiResult<unknown>>;
    onEnd: () => Promise<ApiResult<unknown>>;
}

export const BreakDialog = ({ open, mode, onClose, onStart, onEnd }: BreakDialogProps) => {
    const { mode: dialogMode, error, handleSubmit, reset } = useDialogState();

    const onFormSubmit = async () => {
        await handleSubmit(() => (mode === "start" ? onStart() : onEnd()));
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <DialogWrapper open={open} onClose={handleClose} mode={dialogMode} onReset={reset}>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === "start" ? "休憩を開始しますか？" : "休憩を終了しますか？"}
                        </DialogTitle>
                    </DialogHeader>

                    {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

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
