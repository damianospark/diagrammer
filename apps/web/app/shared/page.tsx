"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SharedListPage() {
  const [shared, setShared] = useState<Array<{ id: string; pin: string; title: string; url: string; createdAt: string }>>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('shared.list')
      setShared(raw ? JSON.parse(raw) : [])
    } catch {}
  }, [])

  return (
    <div className="p-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Shared Charts</CardTitle></CardHeader>
        <CardContent>
          {shared.length === 0 ? (
            <div className="text-sm text-muted-foreground">아직 공유된 페이지가 없습니다</div>
          ) : (
            <ul className="space-y-2">
              {shared.map(s => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.title || s.id}</div>
                    <div className="text-xs text-muted-foreground truncate">PIN: {s.pin} · {s.url}</div>
                  </div>
                  <Button size="sm" asChild>
                    <a href={s.url} target="_blank" rel="noreferrer">열기</a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
