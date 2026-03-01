"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TimeInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

export function TimeInput({ id, label, value, onChange }: TimeInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-32"
      />
    </div>
  )
}
