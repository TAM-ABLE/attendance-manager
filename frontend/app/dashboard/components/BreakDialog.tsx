"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/Loader";
import { SuccessDialog } from "@/components/SuccessDialog";
import type { ApiResult } from "../../../../shared/types/ApiResponse";

interface BreakDialogProps {
    open: boolean;
    mode: "start" | "end";
    onClose: () => void;
    onStart: () => Promise<ApiResult<unknown>>;
    onEnd: () => Promise<ApiResult<unknown>>;
}

export const BreakDialog = ({ open, mode, onClose, onStart, onEnd }: BreakDialogProps) => {
    const [status, setStatus] = useState<"form" | "loading" | "success">("form");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            setStatus("loading");
            setError(null);
            const result = mode === "start" ? await onStart() : await onEnd();

            if (result.success) {
                setStatus("success");
            } else {
                setError(result.error.message);
                setStatus("form");
            }
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Unknown error");
            setStatus("form");
        }
    };

    if (status === "loading") {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="flex justify-center py-12">
                    <Loader size={50} border={4} />
                </DialogContent>
            </Dialog>
        );
    }

    if (status === "success") {
        return (
            <SuccessDialog open={open} onClose={() => { setStatus("form"); onClose(); }} />
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === "start" ? "休憩を開始しますか？" : "休憩を終了しますか？"}
                    </DialogTitle>
                </DialogHeader>

                {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

                <DialogFooter>
                    <Button onClick={handleSubmit}>
                        {mode === "start" ? "開始" : "終了"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
