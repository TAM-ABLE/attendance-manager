"use client"

import { HelpCircle } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface HelpPopoverProps {
  children: ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function HelpPopover({ children, side = "bottom", align = "end" }: HelpPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">ヘルプを表示</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-80 text-sm">
        {children}
      </PopoverContent>
    </Popover>
  )
}
