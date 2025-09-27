"use client"

import * as React from "react"
import { DayPicker, DateRange } from "react-day-picker"
import "react-day-picker/dist/style.css"

export function DateRangePicker({ value, onChange }: { value?: DateRange; onChange?: (r?: DateRange) => void }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <DayPicker
        mode="range"
        selected={value}
        onSelect={onChange}
        styles={{
          caption: { color: "var(--color-foreground)" },
        }}
      />
    </div>
  )
}
