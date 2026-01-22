//dashbaord/hooks/useClockDialogs.ts
"use client"

import { useState } from "react"

export function useClockDialogs() {
  const [showClockInDialog, setClockIn] = useState(false)
  const [showClockOutDialog, setClockOut] = useState(false)
  const [showBreakDialog, setShowBreakDialog] = useState(false)
  const [breakMode, setBreakMode] = useState<"start" | "end">("start")

  return {
    showClockInDialog,
    showClockOutDialog,
    showBreakDialog,
    breakMode,
    openClockIn: () => setClockIn(true),
    openClockOut: () => setClockOut(true),
    openBreakStart: () => {
      setBreakMode("start")
      setShowBreakDialog(true)
    },
    openBreakEnd: () => {
      setBreakMode("end")
      setShowBreakDialog(true)
    },
    closeDialogs: () => {
      setClockIn(false)
      setClockOut(false)
      setShowBreakDialog(false)
    },
  }
}
