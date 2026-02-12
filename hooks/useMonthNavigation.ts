"use client"

import { useCallback, useState } from "react"

export function useMonthNavigation() {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const d = new Date(prev)
      d.setMonth(prev.getMonth() - 1)
      return d
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const d = new Date(prev)
      d.setMonth(prev.getMonth() + 1)
      return d
    })
  }, [])

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date())
  }, [])

  return {
    currentMonth,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
  }
}
