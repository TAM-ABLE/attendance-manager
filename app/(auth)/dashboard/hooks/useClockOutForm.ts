import { useCallback, useState } from "react"
import { getCurrentTimeString } from "@/lib/time"

export function useClockOutForm() {
  const [summary, setSummary] = useState("")
  const [issues, setIssues] = useState("")
  const [notes, setNotes] = useState("")
  const [clockOutTime, setClockOutTime] = useState(getCurrentTimeString())

  const reset = useCallback(() => {
    setSummary("")
    setIssues("")
    setNotes("")
    setClockOutTime(getCurrentTimeString())
  }, [])

  return {
    summary,
    setSummary,
    issues,
    setIssues,
    notes,
    setNotes,
    clockOutTime,
    setClockOutTime,
    reset,
  }
}
