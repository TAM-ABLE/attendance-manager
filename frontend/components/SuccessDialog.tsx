"use client"

import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export const SuccessDialog = ({
  open,
  title = "送信完了",
  description = "正常に送信されました。",
  onClose,
}: {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col items-center text-center py-10">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 justify-center">
          <Button onClick={onClose}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
