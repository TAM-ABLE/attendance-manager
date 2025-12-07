"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export const SuccessDialog = ({
    open,
    title = "送信完了",
    description = "正常に送信されました。",
    onClose,
}: {
    open: boolean;
    title?: string;
    description?: string;
    onClose: () => void;
}) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="flex flex-col items-center text-center py-10">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6">
                    <Button onClick={onClose}>OK</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
