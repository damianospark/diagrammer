"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const [split, setSplit] = useState<number>(() => {
    if (typeof window === "undefined") return 30
    const v = Number(localStorage.getItem("workspace.splitPct") || "30")
    return isNaN(v) ? 30 : Math.max(20, Math.min(80, v))
  })

  useEffect(() => {
    try {
      localStorage.setItem("workspace.splitPct", String(split))
      // same-tab 즉시 반영
      const ev = new CustomEvent("workspace:splitPct", { detail: split })
      window.dispatchEvent(ev)
    } catch {}
  }, [split])

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="text-sm font-medium mb-2">채팅/캔버스 비율</div>
            <label className="block text-xs text-muted-foreground mb-1" htmlFor="split-range">
              채팅 영역 비율: {split}% (캔버스 {100 - split}%)
            </label>
            <input
              id="split-range"
              type="range"
              min={20}
              max={80}
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
              className="w-full"
              aria-label="채팅 영역 비율"
            />
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSplit(30)}>기본(30/70)</Button>
              <Button variant="outline" size="sm" onClick={() => setSplit(40)}>40/60</Button>
              <Button variant="outline" size="sm" onClick={() => setSplit(50)}>50/50</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
