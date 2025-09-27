"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { DiagramRenderer } from "@/components/diagram-renderer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy } from "lucide-react"

export default function SharedPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string

  const [meta, setMeta] = useState<{ id: string; title: string; engine: "mermaid"|"visjs"; created_at: string } | null>(null)
  const [pin, setPin] = useState("")
  const [code, setCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ownerInfo, setOwnerInfo] = useState<{ pin: string; url: string; title?: string } | null>(null)

  // 하이드레이션 불일치를 피하기 위해 클라이언트에서만 URL 생성
  const [url, setUrl] = useState<string>(`/s/${id}`)
  
  // 클라이언트에서만 전체 URL 생성
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/s/${id}`)
    }
  }, [id])

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetch(`/api/v1/share/${id}/meta`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (alive) setMeta(data)
      } catch (e: any) {
        setError(e?.message || "메타 로딩 실패")
      }
    }
    if (id) load()
    return () => { alive = false }
  }, [id])

  // 로컬 저장소에서 공유자 여부 확인 (해당 id가 shared.list에 있으면 공유자)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('shared.list')
      const list: Array<{ id: string; pin: string; url: string; title?: string }> = raw ? JSON.parse(raw) : []
      const found = list.find(x => x.id === id)
      if (found) {
        setOwnerInfo({ pin: found.pin, url: found.url, title: found.title })
      }
    } catch {}
  }, [id])

  async function unlock() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/share/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setCode(data.code)
    } catch (e: any) {
      setError(e?.message || 'PIN 검증 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6">
      {ownerInfo && (
        <div className="fixed top-4 right-4 z-20 rounded-md border bg-background/95 p-3 shadow max-w-sm w-[360px]">
          <div className="text-xs font-medium mb-2">공유 링크</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input value={ownerInfo.url || url} readOnly className="h-8 text-xs" />
              <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { navigator.clipboard.writeText(ownerInfo.url || url) }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input value={ownerInfo.pin} readOnly className="h-8 text-xs font-mono" />
              <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { navigator.clipboard.writeText(ownerInfo.pin) }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{meta?.title || '공유된 페이지'}</CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-3">
            <span>PIN: <strong>{code ? pin : '•••••'}</strong></span>
            <a href={url} className="underline" target="_blank" rel="noreferrer">
              {/* 클라이언트에서만 전체 URL 표시, 서버에서는 경로만 표시 */}
              {typeof window !== 'undefined' ? url : `/s/${id}`}
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {!code ? (
            <div className="space-y-3">
              <div className="text-sm">이 페이지를 보려면 PIN을 입력하세요.</div>
              <div className="flex items-center gap-2">
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase())}
                  placeholder="PIN"
                  className="border rounded-md px-3 py-2 text-sm w-40 bg-background"
                  aria-label="PIN"
                />
                <Button size="sm" onClick={unlock} disabled={loading || pin.trim().length < 3}>{loading ? '확인중…' : '열기'}</Button>
              </div>
              {error && <div className="text-xs text-destructive">{error}</div>}
            </div>
          ) : (
            <div className="h-[70vh] w-full overflow-auto rounded-md border" style={{ borderColor: 'var(--color-border)' }}>
              <DiagramRenderer code={code} engine={meta?.engine || 'mermaid'} className="w-full h-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
