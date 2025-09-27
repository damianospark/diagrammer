"use client"

import { GuestCanvas, GuestCanvasHandle } from "@/components/canvas/GuestCanvas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Copy, FileCode2, ImageIcon, Loader2, Maximize2, Minimize2, Send, Share2, Sparkles, Trash2, Check, X, Download, Edit3, Link2 } from "lucide-react"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/hooks/i18n"
import { cn } from "@/lib/utils"

// Types
export type Engine = "mermaid" | "visjs"

// 채팅 메시지 타입 정의
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  kind: "text" | "code" | "error"
  text?: string
  codeVersionId?: string
}

// 코드 버전 타입 정의
interface CodeVersion {
  id: string
  rootId?: string
  code: string
  engine: Engine
  title: string
  status: "draft" | "applied"
  createdAt: string
  promptSummary?: string
}

export default function Workspace() {
  // toast와 i18n 훅 사용
  const { toast } = useToast()
  const { t } = useI18n()
  
  // 참조 변수
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingHRef = useRef(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  // 각 버전ID별 렌더 상태 저장: 'ok' | 'error'
  const renderStatusRef = useRef<Record<string, 'ok' | 'error'>>({})
  const prevTitleRef = useRef<string>("")
  const guestCanvasRef = useRef<GuestCanvasHandle>(null)
  const resizingRef = useRef<boolean>(false)
  // 중복 요청 방지용 즉시 락 및 요청 취소 컨트롤러
  const sendingRef = useRef<boolean>(false)
  const generateAbortRef = useRef<AbortController | null>(null)
  
  // 상태 변수
  const [openRevisionByRoot, setOpenRevisionByRoot] = useState<Record<string, string>>({})
  const [openRootId, setOpenRootId] = useState<string | null>(null)
  const [workspaceMode, setWorkspaceMode] = useState<'guest' | 'member'>('guest')
  const [splitPct, setSplitPct] = useState(30)
  const [downloading, setDownloading] = useState({ png: false, svg: false, copy: false })
  const [shareInfo, setShareInfo] = useState<{ id: string; pin: string; url: string; title?: string } | null>(null)
  const [shareTitleDraft, setShareTitleDraft] = useState<string>("")
  const [shareMode, setShareMode] = useState<'form' | 'result' | 'conflict' | null>(null)
  // 라이브 프리뷰 상태: 드래프트 편집 시 캔버스 실시간 렌더링
  const [livePreviewCode, setLivePreviewCode] = useState<string>("")
  const [livePreviewEngine, setLivePreviewEngine] = useState<'mermaid' | 'visjs'>('mermaid')
  const [existingShared, setExistingShared] = useState<SharedRecord | null>(null)
  type SharedRecord = { id: string; pin: string; title: string; url: string; createdAt: string; versionId?: string; rootId?: string }
  const [sharedByVersion, setSharedByVersion] = useState<Record<string, SharedRecord>>({})
  const [sharedByRoot, setSharedByRoot] = useState<Record<string, SharedRecord>>({})
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [versions, setVersions] = useState<CodeVersion[]>([])
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [messageDraft, setMessageDraft] = useState<string>("")
  // 질문 버블 액션바 고정용 상태 (hover를 벗어나도 유지)
  const [actionBarFor, setActionBarFor] = useState<string | null>(null)
  // 삭제 팝오버 열린 상태 (버블별)
  const [openDeleteFor, setOpenDeleteFor] = useState<string | null>(null)
  // 현재 versions 스냅샷 참조용 (메시지 업데이트 시 루트 판별 안정화)
  const versionsRef = useRef<CodeVersion[]>([])
  useEffect(() => { versionsRef.current = versions }, [versions])

  // selection/task/input states (효과 훅에서 사용되므로 먼저 선언)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [taskTitle, setTaskTitle] = useState<string>("")
  const [input, setInput] = useState<string>("")
  const [sending, setSending] = useState<boolean>(false)
  const [editingTitle, setEditingTitle] = useState<boolean>(false)
  const [draftValue, setDraftValue] = useState<string>("")
  const [draftHeightPct, setDraftHeightPct] = useState(40)
  const [resizing, setResizing] = useState<boolean>(false)
  const [engine, setEngine] = useState<Engine>("mermaid")
  const [provider, setProvider] = useState<"gemini" | "mock">("gemini")
  const [intent, setIntent] = useState<string>("")

  // 로컬 스토리지에서 상태 복원
  useEffect(() => {
    try {
      // 태스크가 선택된 상태라면 태스크 단위 복원을 loadTask로 위임
      const tid = localStorage.getItem('tasks.currentId')
      if (tid) return
      const rawV = localStorage.getItem('workspace.versions')
      if (rawV) {
        const parsed: CodeVersion[] = JSON.parse(rawV)
        if (Array.isArray(parsed)) setVersions(parsed)
      }
      const rawM = localStorage.getItem('workspace.messages')
      if (rawM) {
        const parsedM = JSON.parse(rawM)
        if (Array.isArray(parsedM)) setMessages(parsedM)
      }
    } catch {}
  }, [])
  // 변경 시 지속화
  useEffect(() => {
    try {
      localStorage.setItem('workspace.versions', JSON.stringify(versions))
      if (currentTaskId) {
        localStorage.setItem(`workspace.versions.${currentTaskId}`, JSON.stringify(versions))
      }
    } catch {}
  }, [versions, currentTaskId])
  useEffect(() => {
    try {
      localStorage.setItem('workspace.messages', JSON.stringify(messages))
      if (currentTaskId) {
        localStorage.setItem(`workspace.messages.${currentTaskId}`, JSON.stringify(messages))
      }
    } catch {}
  }, [messages, currentTaskId])

  // 공유 인덱스 로딩 및 동기화 (shared.list → versionId 매핑)
  useEffect(() => {
    const reloadShared = () => {
      try {
        const raw = localStorage.getItem('shared.list')
        const list: SharedRecord[] = raw ? JSON.parse(raw) : []
        const byVersion: Record<string, SharedRecord> = {}
        const byRoot: Record<string, SharedRecord> = {}
        list.forEach((r) => {
          if (r.versionId) byVersion[r.versionId] = r
          if (r.rootId) byRoot[r.rootId] = r
        })
        setSharedByVersion(byVersion)
        setSharedByRoot(byRoot)
      } catch {}
    }
    reloadShared()
    const handler = () => reloadShared()
    window.addEventListener('shared:updated' as any, handler as any)
    return () => window.removeEventListener('shared:updated' as any, handler as any)
  }, [])

  // 사용자 질문 버블 편집 시작
  const startEditUserMessage = useCallback((messageId: string) => {
    const msg = messages.find(m => m.id === messageId && m.role === 'user')
    if (!msg) return
    setEditingMessageId(messageId)
    setMessageDraft(msg.text || '')
  }, [messages])

  // 사용자 질문 버블 편집 취소
  const cancelEditUserMessage = useCallback(() => {
    setEditingMessageId(null)
    setMessageDraft("")
  }, [])

  // 사용자 질문 버블 삭제 (확인 후 호출)
  const deleteUserMessage = useCallback((messageId: string) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === messageId)
      if (idx < 0) return prev.filter(m => m.id !== messageId)
      const next = [...prev]
      // 선택된 사용자 메시지 제거
      next.splice(idx, 1)
      // 뒤따르는 첫 assistant code 버블도 함께 제거
      const asstIdx = next.findIndex((m, i) => i >= idx && m.role === 'assistant' && m.kind === 'code')
      if (asstIdx >= 0) next.splice(asstIdx, 1)
      return next
    })
  }, [])

  // 사용자 질문 저장 및 서버 재요청 후 기존 답변 교체
  const saveUserMessageEdit = useCallback(async (messageId: string) => {
    const newText = messageDraft.trim()
    if (!newText) return
    // 1) 메시지 텍스트 교체
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText } : m))

    // 2) 서버 재요청: 기존 generateFromPrompt를 변형하여 사용자 버블 추가 없이 동작
    try {
      if (sendingRef.current) return
      sendingRef.current = true
      setSending(true)
      try { generateAbortRef.current?.abort() } catch {}
      const controller = new AbortController()
      generateAbortRef.current = controller
      const response = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: newText, engine, provider }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(await response.text())
      const result = await response.json()
      if (!result?.success) throw new Error(result?.error || "Generation failed")

      // 3) 새 리비전 생성 및 기존 답변 버블 교체
      const newId = result.diagram_id || uid()
      const detectedEngine = detectEngineFromCode(result.code)
      const version: CodeVersion = {
        id: newId,
        title: `v${versions.length + 1} – ${detectedEngine === "mermaid" ? "Mermaid" : "vis.js"}`,
        createdAt: new Date().toISOString(),
        engine: detectedEngine,
        code: result.code,
        promptSummary: summarizePrompt(newText),
        status: "applied",
        rootId: newId,
      }
      setVersions(prev => [version, ...prev])
      setSelectedVersionId(version.id)
      setOpenRootId(version.rootId || version.id)
      pruneRevisions(version.rootId || version.id, 5)

      // 편집된 사용자 메시지 뒤의 첫 번째 assistant code 버블을 찾아 교체
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === messageId)
        if (idx >= 0) {
          const next = [...prev]
          const asstIdx = next.findIndex((m, i) => i > idx && m.role === 'assistant' && m.kind === 'code')
          if (asstIdx >= 0) {
            next[asstIdx] = { ...next[asstIdx], codeVersionId: version.id }
            return next
          }
          // 없으면 뒤에 1개 추가
          next.splice(idx + 1, 0, { id: uid(), role: 'assistant', kind: 'code', codeVersionId: version.id })
          return next
        }
        return prev
      })

      toast({ title: t("preview"), description: t("generate") + " OK" })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Unknown error", variant: "destructive" })
    } finally {
      sendingRef.current = false
      setSending(false)
      generateAbortRef.current = null
      setEditingMessageId(null)
      setMessageDraft("")
    }
  }, [messageDraft, engine, provider, messages])
  
  // 코드펜스 제거 유틸 (표시는 칩으로 대체함) - 전역 스코프
  function stripCodeFenceLocal(input: string): string {
    return String(input || '')
      .replace(/^```[a-zA-Z0-9_-]*\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim()
  }
  
  // 코드 내용에서 엔진 자동 판별 (전역 스코프)
  function detectEngineFromCode(input: string): 'mermaid' | 'visjs' {
    const raw = String(input || '')
    const fenced = /^```(\w+)/i.exec(raw)?.[1]?.toLowerCase()
    if (fenced === 'mermaid') return 'mermaid'
    if (fenced === 'dot' || fenced === 'graphviz') return 'visjs'
    const stripped = raw
      .replace(/^```[a-zA-Z0-9_-]*\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim()
    const mermaidStarts = /^(graph\s+(TD|LR|BT|RL)\b|flowchart\b|sequenceDiagram\b|classDiagram\b|erDiagram\b|gantt\b|pie\b|journey\b|stateDiagram)/i
    if (mermaidStarts.test(stripped)) return 'mermaid'
    const firstLine = stripped.split(/\n/, 1)[0] || ''
    const dotFirstLine = /^(digraph|graph)\b[^\n\{]*\{/i.test(firstLine)
    if (dotFirstLine) return 'visjs'
    // 기본값: mermaid를 우선
    return 'mermaid'
  }
  // 추천 프롬프트 정의
  const SUGGESTIONS = [
    "사용자 로그인 플로우 만들어줘",
    "상품 구매 프로세스 다이어그램",
    "회사 조직도 작성해줘",
    "데이터베이스 ER 다이어그램",
    "웹 서비스 아키텍처 만들어줘"
  ];
  
  // 비코드 메시지에 포함된 마크다운 코드펜스를 탐지해 칩(언어) + 코드 본문만 렌더링
  function renderMessageContent(text?: string) {
    const raw = text || ''
    // ```lang\n...``` 첫 블록만 처리
    const m = raw.match(/```(\w+)?\n([\s\S]*?)```/)
    if (!m) {
      return <div className="text-sm whitespace-pre-wrap">{raw}</div>
    }
    const lang = (m[1] || '').toLowerCase()
    const code = m[2] || ''
    const label = lang === 'mermaid' ? 'Mermaid' : (lang === 'dot' || lang === 'graphviz' ? 'Graphviz' : (lang || 'Code'))
    return (
      <div className="space-y-2">
        <div>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">{label}</Badge>
        </div>
        <pre className="text-xs whitespace-pre-wrap leading-relaxed">{code}</pre>
      </div>
    )
  }
  
  // 선택된 버전 계산
  const selectedVersion = useMemo(() => {
    if (!selectedVersionId) return null
    return versions.find(v => v.id === selectedVersionId) || null
  }, [selectedVersionId, versions])

  // 드래프트 편집 중에는 draftValue를 디바운싱하여 캔버스에 반영
  useEffect(() => {
    const v = selectedVersion
    if (!v) return
    if (v.status === 'draft') {
      const handle = setTimeout(() => {
        const code = draftValue
        const eng = detectEngineFromCode(code)
        setLivePreviewCode(code)
        setLivePreviewEngine(eng)
      }, 300)
      return () => clearTimeout(handle)
    } else {
      // 일반 모드에서는 선택된 버전의 코드/엔진을 그대로 사용
      setLivePreviewCode(v.code)
      setLivePreviewEngine(v.engine)
    }
  }, [selectedVersion, draftValue])

  // Keep only last N applied revisions per root
  function pruneRevisions(rootId: string, keep: number = 5) {
    setVersions(prev => {
      const applied = prev
        .filter(v => (v.rootId || v.id) === rootId && v.status === "applied")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      const removeIds = new Set(applied.slice(keep).map(v => v.id))
      if (removeIds.size === 0) return prev

      const next = prev.filter(v => !removeIds.has(v.id))
      const latestKept = applied[0]?.id

      if (latestKept) {
        setMessages(old =>
          old.map(m =>
            m.codeVersionId && removeIds.has(m.codeVersionId)
              ? { ...m, codeVersionId: latestKept }
              : m
          )
        );

        setSelectedVersionId(curr =>
          curr && removeIds.has(curr) ? latestKept : curr
        );
      }

      return next;
    });
  }

  /** 현재 선택된 태스크 삭제 */
  function deleteCurrentTask() {
    if (!currentTaskId) return
    const confirmed = window.confirm(t('정말 이 작업을 삭제할까요? 복구할 수 없습니다.') || '정말 이 작업을 삭제할까요? 복구할 수 없습니다.')
    if (!confirmed) return
    try {
      const raw = localStorage.getItem('tasks.list')
      const list = raw ? JSON.parse(raw) : []
      const idx = list.findIndex((x: any) => x.id === currentTaskId)
      if (idx < 0) return
      list.splice(idx, 1)
      localStorage.setItem('tasks.list', JSON.stringify(list))
      const fallback = list[idx] || list[idx - 1] || list[0]
      if (fallback?.id) {
        localStorage.setItem('tasks.currentId', fallback.id)
        setCurrentTaskId(fallback.id)
        loadTask(fallback.id)
        window.dispatchEvent(new CustomEvent('tasks:select', { detail: { id: fallback.id } }))
      } else {
        localStorage.removeItem('tasks.currentId')
        setCurrentTaskId(null)
        setTaskTitle('')
        setMessages([])
        setVersions([])
        setSelectedMessageId(null)
        setSelectedVersionId(null)
        setOpenRootId(null)
        setOpenRevisionByRoot({})
        renderStatusRef.current = {}
      }
      window.dispatchEvent(new CustomEvent('tasks:updated'))
      setEditingTitle(false)
      toast({ title: t('삭제됨') || '삭제됨', description: t('작업이 삭제되었습니다.') || '작업이 삭제되었습니다.' })
    } catch (e: any) {
      toast({ title: t('오류') || '오류', description: e?.message || 'delete error', variant: 'destructive' })
    }
  }

  useEffect(() => {
    timelineRef.current?.scrollTo({ top: timelineRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  // persist split setting
  useEffect(() => {
    try { localStorage.setItem('workspace.splitPct', String(splitPct)) } catch {}
  }, [splitPct])

  // sync split from external settings page via storage event
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'workspace.splitPct' && e.newValue) {
        const v = Number(e.newValue)
        if (!isNaN(v)) setSplitPct(Math.max(20, Math.min(80, v)))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Task helpers
  function saveTaskMessages(taskId: string, msgs: ChatMessage[], vers: CodeVersion[]) {
    try {
      const raw = localStorage.getItem('tasks.list')
      const list = raw ? JSON.parse(raw) : []
      const idx = list.findIndex((x: any) => x.id === taskId)
      const simplified = msgs.map(m => {
        if (m.kind === 'text' && m.text) return { role: m.role, content: m.text }
        if (m.kind === 'code' && m.codeVersionId) {
          const v = vers.find(vv => vv.id === m.codeVersionId)
          if (v) return { role: 'assistant', content: v.code }
        }
        return null
      }).filter(Boolean)
      if (idx >= 0) {
        list[idx].messages = simplified
        localStorage.setItem('tasks.list', JSON.stringify(list))
        // same-tab listeners update
        window.dispatchEvent(new CustomEvent('tasks:updated'))
        // 태스크 단위로 전체 상태도 저장 (리비전 보존)
        try {
          localStorage.setItem(`workspace.versions.${taskId}`, JSON.stringify(vers))
          localStorage.setItem(`workspace.messages.${taskId}`, JSON.stringify(msgs))
        } catch {}
      }
    } catch {}
  }

  function loadTask(taskId: string) {
    try {
      const raw = localStorage.getItem('tasks.list')
      const list = raw ? JSON.parse(raw) : []
      const task = list.find((x: any) => x.id === taskId)
      if (!task) return
      // 태스크 단위 저장본이 있으면 우선 복원
      try {
        const rawV = localStorage.getItem(`workspace.versions.${taskId}`)
        const rawM = localStorage.getItem(`workspace.messages.${taskId}`)
        if (rawV && rawM) {
          const vv: CodeVersion[] = JSON.parse(rawV)
          const mm: ChatMessage[] = JSON.parse(rawM)
          if (Array.isArray(vv) && Array.isArray(mm)) {
            setTaskTitle(String(task.title || ""))
            setVersions(vv)
            setMessages(mm)
            // 선택 상태 유도: 마지막 assistant 코드 버블을 선택
            const lastCode = [...mm].reverse().find(m => m.role === 'assistant' && m.kind === 'code' && m.codeVersionId)
            if (lastCode) {
              setSelectedMessageId(lastCode.id)
              setSelectedVersionId(lastCode.codeVersionId || null)
              const v = vv.find(v => v.id === lastCode.codeVersionId)
              if (v) setOpenRootId(v.rootId || v.id)
            } else {
              setSelectedMessageId(null)
              setSelectedVersionId(null)
            }
            return
          }
        }
      } catch {}
      setTaskTitle(String(task.title || ""))
      const newMsgs: ChatMessage[] = []
      const newVers: CodeVersion[] = []
      if (Array.isArray(task.messages)) {
        task.messages.forEach((m: any, i: number) => {
          if (m?.role === 'user') {
            newMsgs.push({ id: uid(), role: 'user', kind: 'text', text: String(m.content ?? '') })
          } else if (m?.role === 'assistant') {
            const id = uid()
            const v: CodeVersion = {
              id,
              title: `v${i + 1} – Mermaid`,
              createdAt: new Date().toISOString(),
              engine: 'mermaid',
              code: String(m.content ?? ''),
              promptSummary: summarizePrompt(String(m.content ?? '')),
              status: 'applied',
              rootId: id,
            }
            newVers.push(v)
            newMsgs.push({ id: uid(), role: 'assistant', kind: 'code', codeVersionId: id })
          }
        })
      }
      setVersions(newVers)
      setMessages(newMsgs)
      setSelectedVersionId(newVers.length ? newVers[newVers.length - 1].id : null)
      setSelectedMessageId(newMsgs.length ? newMsgs[newMsgs.length - 1].id : null)
    } catch {}
  }

  // React to tasks events
  useEffect(() => {
    function onNew(e: Event) {
      try {
        const id = (e as CustomEvent).detail?.id as string
        setCurrentTaskId(id)
        setMessages([])
        setVersions([])
        setSelectedMessageId(null)
        setSelectedVersionId(null)
        renderStatusRef.current = {}
      } catch {}
    }
    function onSelect(e: Event) {
      try {
        const id = (e as CustomEvent).detail?.id as string
        setCurrentTaskId(id)
        loadTask(id)
      } catch {}
    }
    window.addEventListener('tasks:new' as any, onNew as any)
    window.addEventListener('tasks:select' as any, onSelect as any)
    return () => {
      window.removeEventListener('tasks:new' as any, onNew as any)
      window.removeEventListener('tasks:select' as any, onSelect as any)
    }
  }, [])

  // Persist messages to current task
  useEffect(() => {
    if (!currentTaskId) return
    saveTaskMessages(currentTaskId, messages, versions)
  }, [messages, versions, currentTaskId])

  // Listen updates to refresh title
  useEffect(() => {
    const reload = () => {
      try {
        if (!currentTaskId) return
        const raw = localStorage.getItem('tasks.list')
        const list = raw ? JSON.parse(raw) : []
        const task = list.find((x: any) => x.id === currentTaskId)
        if (task) setTaskTitle(String(task.title || ""))
      } catch {}
    }
    window.addEventListener('tasks:updated' as any, reload as any)
    return () => window.removeEventListener('tasks:updated' as any, reload as any)
  }, [currentTaskId])

  function renameCurrentTaskTitle(nextTitle: string) {
    try {
      const raw = localStorage.getItem('tasks.list')
      const list = raw ? JSON.parse(raw) : []
      const idx = list.findIndex((x: any) => x.id === currentTaskId)
      if (idx >= 0) {
        list[idx].title = nextTitle || list[idx].title
        localStorage.setItem('tasks.list', JSON.stringify(list))
        window.dispatchEvent(new CustomEvent('tasks:updated'))
        setTaskTitle(nextTitle)
        toast({ title: t('저장됨') || '저장됨', description: t('작업 제목이 업데이트되었습니다.') || '작업 제목이 업데이트되었습니다.' })
      }
    } catch (e: any) {
      toast({ title: t('오류') || '오류', description: e?.message || 'rename error', variant: 'destructive' })
    }
  }

  // read split setting on mount (client only)
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem('workspace.splitPct') || '30')
      if (!isNaN(v)) setSplitPct(Math.max(20, Math.min(80, v)))
      const tid = localStorage.getItem('tasks.currentId')
      if (tid) { setCurrentTaskId(tid); loadTask(tid) }
    } catch {}
  }, [])

  // sync split via custom event for same-tab updates
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent
        const v = Number(ce.detail)
        if (!isNaN(v)) setSplitPct(Math.max(20, Math.min(80, v)))
      } catch {}
    }
    window.addEventListener('workspace:splitPct' as any, handler as any)
    return () => window.removeEventListener('workspace:splitPct' as any, handler as any)
  }, [])

  // 선택된 버블 ↔ 캔버스 렌더 소스 동기화 보강
  useEffect(() => {
    if (!selectedMessageId) return
    const msg = messages.find(m => m.id === selectedMessageId)
    if (msg?.codeVersionId && msg.codeVersionId !== selectedVersionId) {
      setSelectedVersionId(msg.codeVersionId)
    }
  }, [selectedMessageId, messages])

  useEffect(() => {
    // 최초 코드 메시지가 생겼는데 아직 선택이 없다면 최신 코드 메시지를 자동 선택
    if (!selectedMessageId) {
      const lastCode = [...messages].reverse().find(m => m.role === 'assistant' && m.kind === 'code' && m.codeVersionId)
      if (lastCode) {
        setSelectedMessageId(lastCode.id)
        const v = versions.find(v => v.id === lastCode.codeVersionId)
        if (v) setOpenRootId(v.rootId || v.id)
      }
    }
  }, [messages, selectedMessageId, versions])

  async function generateFromPrompt(prompt: string) {
    // 즉시 락으로 중복 전송 방지 (state 업데이트 지연 대비)
    if (sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    
    // 입력 필드 초기화 - setTimeout을 사용해 비동기로 처리
    setTimeout(() => {
      setInput("")
    }, 0)
    
    const userMsgId = uid()
    const userMsg: ChatMessage = { id: userMsgId, role: "user", kind: "text", text: prompt }
    setMessages((prev) => [...prev.filter(m => m.id !== userMsgId), userMsg])

    try {
      // 이전 요청이 있으면 취소
      try { generateAbortRef.current?.abort() } catch {}
      const controller = new AbortController()
      generateAbortRef.current = controller
      const response = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, engine, provider }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const txt = await response.text()
        throw new Error(txt || "API error")
      }
      const result = await response.json()
      if (!result?.success) throw new Error(result?.error || "Generation failed")

      const newId = result.diagram_id || uid()
      const detectedEngine = detectEngineFromCode(result.code)
      const version: CodeVersion = {
        id: newId,
        title: `v${versions.length + 1} – ${detectedEngine === "mermaid" ? "Mermaid" : "vis.js"}`,
        createdAt: new Date().toISOString(),
        engine: detectedEngine,
        code: result.code,
        promptSummary: summarizePrompt(prompt),
        status: "applied",
        rootId: newId,
      }

      setVersions((prev) => [version, ...prev])
      setSelectedVersionId(version.id)
      setOpenRootId(version.rootId || version.id)
      pruneRevisions(version.rootId || version.id, 5)

      const asstMsgId = uid()
      const asstMsg: ChatMessage = { id: asstMsgId, role: "assistant", kind: "code", codeVersionId: version.id }
      setMessages((prev) => [...prev.filter(m => m.id !== asstMsgId), asstMsg])
      setSelectedMessageId(asstMsg.id)

      toast({ title: t("preview"), description: t("generate") + " OK" })
    } catch (e: any) {
      const raw = e?.message || "Error"
      let friendly = raw
      if (/No diagram code detected/i.test(raw)) {
        friendly = "코드 미감지: Mermaid 형식의 다이어그램 코드가 필요합니다. 예) graph TD; A-->B;"
      } else if (/No valid vis\.js JSON detected/i.test(raw)) {
        friendly = "코드 미감지: vis.js JSON(nodes/edges)이 필요합니다. 예) {\"nodes\":[...],\"edges\":[...]}"
      } else if (/Mermaid 렌더링 오류/i.test(raw)) {
        friendly = "렌더 실패: 코드 형식이 Mermaid 규칙과 다릅니다. 'graph TD' 혹은 유효한 다이어그램 타입을 사용해 주세요."
      } else if (e?.name === 'AbortError') {
        friendly = "요청이 취소되었습니다."
      }
      const errorMsgId = uid()
      setMessages((prev) => [
        ...prev.filter(m => m.role !== "assistant" || m.kind !== "error" || m.id === errorMsgId),
        { id: errorMsgId, role: "assistant", kind: "error", text: friendly },
      ])
      toast({ title: "Error", description: e?.message || "Unknown error", variant: "destructive" })
    } finally {
      sendingRef.current = false
      setSending(false)
      generateAbortRef.current = null
    }
  }

  const triggerRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // 기존 리플 요소가 있는지 확인하고 제거
    const button = event.currentTarget
    const existingRipples = button.querySelectorAll('.canvas-action-ripple')
    existingRipples.forEach(ripple => ripple.remove())
    
    // 새 리플 요소 생성
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 1.5 // 더 크게 만들어 리플이 버튼을 충분히 덮도록 함
    const ripple = document.createElement('span')
    ripple.className = 'canvas-action-ripple'
    
    // 클릭 위치 계산 (클릭이 없으면 가운데에 배치)
    const x = event.clientX ? event.clientX - rect.left : rect.width / 2
    const y = event.clientY ? event.clientY - rect.top : rect.height / 2
    
    // 리플 요소 스타일 설정
    ripple.style.width = `${size}px`
    ripple.style.height = `${size}px`
    ripple.style.left = `${x - size / 2}px`
    ripple.style.top = `${y - size / 2}px`
    
    // 색상 설정
    const rippleColor = button.getAttribute('data-ripple-color') || 'rgba(255,255,255,0.4)'
    ripple.style.background = rippleColor
    
    // 버튼에 리플 요소 추가
    button.appendChild(ripple)
    
    // 애니메이션 완료 후 자동 제거
    ripple.addEventListener('animationend', () => ripple.remove())
  }, [])

  // Export helpers
  const exportPNG = useCallback(async () => {
    if (!guestCanvasRef.current || downloading.png) return
    setDownloading(prev => ({ ...prev, png: true }))
    try {
      const url = await guestCanvasRef.current.toPNG()
      if (!url) throw new Error('PNG 생성 실패')
      const a = document.createElement('a')
      a.href = url
      a.download = 'diagram.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast({ title: t('완료') || '완료', description: t('PNG로 저장되었습니다.') || 'PNG로 저장되었습니다.' })
    } catch (err: any) {
      toast({ title: t('오류') || '오류', description: err?.message || 'PNG export error', variant: 'destructive' })
    } finally {
      setDownloading(prev => ({ ...prev, png: false }))
    }
  }, [downloading.png, guestCanvasRef, t, toast])

  const exportSVG = useCallback(async () => {
    if (!guestCanvasRef.current || downloading.svg) return
    setDownloading(prev => ({ ...prev, svg: true }))
    try {
      const svg = guestCanvasRef.current.getSVG()
      if (!svg) throw new Error('SVG 생성 실패')
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'diagram.svg'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast({ title: t('완료') || '완료', description: t('SVG로 저장되었습니다.') || 'SVG로 저장되었습니다.' })
    } catch (err: any) {
      toast({ title: t('오류') || '오류', description: err?.message || 'SVG export error', variant: 'destructive' })
    } finally {
      setDownloading(prev => ({ ...prev, svg: false }))
    }
  }, [downloading.svg, guestCanvasRef, t, toast])

  const exportCopyImage = useCallback(async () => {
    if (!guestCanvasRef.current || downloading.copy) return
    setDownloading(prev => ({ ...prev, copy: true }))
    try {
      const blob = await guestCanvasRef.current.toBlob()
      if (!blob) throw new Error('이미지 생성 실패')
      // Clipboard API (image) with feature detection and fallback
      const canWriteImage = typeof window !== 'undefined' && 'ClipboardItem' in window && navigator?.clipboard?.write
      if (canWriteImage) {
        const item = new ClipboardItem({ [blob.type]: blob })
        await navigator.clipboard.write([item as any])
        toast({ title: t('복사됨') || '복사됨', description: t('이미지가 클립보드에 복사되었습니다.') || '이미지가 클립보드에 복사되었습니다.' })
      } else if (navigator?.clipboard?.writeText) {
        // Fallback: copy as data URL text
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader()
          fr.onload = () => resolve(String(fr.result))
          fr.onerror = () => reject(new Error('DataURL 변환 실패'))
          fr.readAsDataURL(blob)
        })
        await navigator.clipboard.writeText(dataUrl)
        toast({ title: t('복사됨') || '복사됨', description: t('브라우저 제한으로 데이터 URL로 복사되었습니다. 붙여넣기 후 이미지로 인식되지 않으면 PNG 저장을 사용하세요.') || '브라우저 제한으로 데이터 URL로 복사되었습니다. 붙여넣기 후 이미지로 인식되지 않으면 PNG 저장을 사용하세요.' })
      } else {
        throw new Error('클립보드 API를 지원하지 않는 환경입니다')
      }
    } catch (err) {
      toast({ title: t('오류') || '오류', description: t('이미지 복사에 실패했습니다. PNG 저장 기능을 이용해주세요.') || '이미지 복사에 실패했습니다. PNG 저장 기능을 이용해주세요.', variant: 'destructive' })
    } finally {
      setDownloading(prev => ({ ...prev, copy: false }))
    }
  }, [downloading.copy, guestCanvasRef, t, toast])

  // Canvas render status
  function onCanvasRendered(status: 'ok' | 'error', message?: string) {
    if (selectedVersionId) {
      renderStatusRef.current[selectedVersionId] = status
    }
  }

  // Intent chip extraction (very simple heuristics)
  useEffect(() => {
    const text = input.toLowerCase()
    let tag = ''
    if (/trend|추이|시계열/.test(text)) tag = 'Trend'
    else if (/compare|비교/.test(text)) tag = 'Compare'
    else if (/proportion|비율|pie|도넛/.test(text)) tag = 'Proportion'
    else if (/distribution|분포|hist/.test(text)) tag = 'Distribution'
    else if (/scatter|상관|correlation/.test(text)) tag = 'Correlation'
    setIntent(tag)
  }, [input])

  // Keyboard loop: Alt+Up/Down between assistant code messages; Cmd/Ctrl+I focus input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        const codeMsgs = messages.filter(m => m.role === 'assistant' && m.kind === 'code')
        if (codeMsgs.length === 0) return
        const idx = codeMsgs.findIndex(m => m.id === selectedMessageId)
        const nextIdx = e.key === 'ArrowDown' ? Math.min(codeMsgs.length - 1, idx + 1) : Math.max(0, idx - 1)
        const target = codeMsgs[nextIdx] || codeMsgs[0]
        setSelectedMessageId(target.id)
        if (target.codeVersionId) setSelectedVersionId(target.codeVersionId)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        ;(document.getElementById('prompt-input') as HTMLTextAreaElement | null)?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [messages, selectedMessageId])

  // Draft overlay resizing handlers
  function onResizeStart() { resizingRef.current = true }
  function onResizeMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!resizingRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const fromTop = e.clientY - rect.top
    const pct = Math.max(30, Math.min(90, Math.round((fromTop / rect.height) * 100)))
    setDraftHeightPct(pct)
  }
  function onResizeEnd() { resizingRef.current = false }

  // Horizontal splitter handlers
  function onHDragMove(e: MouseEvent | React.MouseEvent<HTMLDivElement>) {
    if (!draggingHRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ("clientX" in e ? e.clientX : 0) - rect.left
    const pct = Math.max(20, Math.min(80, Math.round((x / rect.width) * 100)))
    setSplitPct(pct)
  }
  function onHDragEnd() {
    draggingHRef.current = false
    window.removeEventListener('mousemove', onHDragMove as any)
    window.removeEventListener('mouseup', onHDragEnd as any)
  }
  function onHDragStart(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    draggingHRef.current = true
    window.addEventListener('mousemove', onHDragMove as any)
    window.addEventListener('mouseup', onHDragEnd as any)
  }

  function startEdit(versionId: string) {
    const base = versions.find(v => v.id === versionId)
    if (!base) return
    const draft: CodeVersion = {
      ...base,
      id: uid(),
      title: `${base.title} (draft)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      rootId: base.rootId || base.id,
    }
    setVersions(prev => [draft, ...prev])
    setSelectedVersionId(draft.id)
    setOpenRootId(draft.rootId || draft.id)
    setDraftValue(stripCodeFenceLocal(base.code))
  }

  function applyDraft(versionId: string, newCode: string) {
    const draft = versions.find(v => v.id === versionId)
    if (!draft) return
    const nextEngine = detectEngineFromCode(newCode)
    const applied: CodeVersion = {
      ...draft,
      code: newCode,
      engine: nextEngine,
      status: "applied",
      title: draft.title.replace(" (draft)", ""),
      rootId: draft.rootId || draft.id,
    }
    const rootId = applied.rootId || applied.id

    // 1) 버전 목록 업데이트: draft를 applied로 교체, 나머지 동일 루트 리비전은 보존
    setVersions(prev => [applied, ...prev.filter(v => v.id !== versionId)])
    // 동일 루트의 적용 리비전을 최대 5개로만 유지
    pruneRevisions(rootId, 5)

    // 2) 타임라인의 기존 코드 버블이 최신 리비전을 가리키도록 업데이트 (같은 루트의 대표 버블 1개를 교체)
    setMessages(prev => {
      const next = [...prev]
      const targetIdx = next.findIndex(m => {
        if (!(m.role === 'assistant' && m.kind === 'code' && m.codeVersionId)) return false
        const v = versionsRef.current.find(vv => vv.id === m.codeVersionId)
        const rid = v?.rootId || v?.id
        return rid === rootId
      })
      if (targetIdx >= 0) {
        next[targetIdx] = { ...next[targetIdx], codeVersionId: applied.id }
      }
      return next
    })

    // 3) 최신 리비전을 활성화하고, 해당 루트의 마커 포커스 이동
    setSelectedVersionId(applied.id)
    setOpenRootId(rootId)
    setOpenRevisionByRoot(prev => ({ ...prev, [rootId]: applied.id }))

    toast({ title: "적용됨", description: "캔버스가 갱신되었습니다." })
  }

  function cancelDraft(versionId: string) {
    setVersions(prev => prev.filter(v => v.id !== versionId))
    if (selectedVersionId === versionId) {
      setSelectedVersionId(versions.find(v => v.status === "applied")?.id ?? null)
    }
    toast({ title: "취소", description: "초안이 폐기되었습니다." })
  }

  function copyCode(versionId: string) {
    const v = versions.find(v => v.id === versionId)
    if (!v) return
    navigator.clipboard.writeText(v.code)
    toast({ title: "복사됨", description: "코드가 클립보드에 복사되었습니다." })
  }

  function exportCode(versionId: string) {
    const v = versions.find(v => v.id === versionId)
    if (!v) return
    const blob = new Blob([v.code], { type: "text/plain;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = v.engine === "mermaid" ? `${v.id}.mmd` : `${v.id}.txt`
    a.click()
  }

  function getChartOrdinalWithinTask(rootId?: string) {
    try {
      const rid = rootId || selectedVersion?.rootId || selectedVersion?.id
      if (!rid) return 1
      const related = versions
        .filter(v => (v.rootId || v.id) === rid && v.status === 'applied')
        .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      const idx = related.findIndex(v => v.id === selectedVersionId)
      return (idx >= 0 ? idx : related.length - 1) + 1
    } catch { return 1 }
  }

  async function onShare() {
    try {
      const v = selectedVersion
      if (!v) {
        toast({ title: "공유 실패", description: "공유할 캔버스가 없습니다.", variant: "destructive" })
        return
      }
      // 기본 차트명: "{작업이름}의 {N}번째 차트"
      const ordinal = getChartOrdinalWithinTask(v.rootId)
      const defaultTitle = `${taskTitle || '새작업'}의 ${ordinal}번째 차트`
      const titleForShare = (shareTitleDraft || defaultTitle).trim()
      const res = await fetch("/api/v1/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: v.code, engine: v.engine, title: titleForShare })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const id = data.id
      const pin = data.pin
      // 클라이언트에서만 사용하는 전체 URL
      const url = `/s/${id}`
      // 저장용 전체 URL
      const fullUrl = `${window.location.origin}${url}`
      // persist shared link
      try {
        const raw = localStorage.getItem('shared.list')
        const list = raw ? JSON.parse(raw) : []
        list.unshift({ id, pin, title: titleForShare, url: fullUrl, createdAt: data.created_at || new Date().toISOString(), versionId: v.id, rootId: v.rootId || v.id })
        localStorage.setItem('shared.list', JSON.stringify(list))
        window.dispatchEvent(new CustomEvent('shared:updated'))
      } catch {}
      // 공유 정보 저장 (팝오버에 표시용)
      setShareInfo({ id, pin, url: fullUrl, title: titleForShare })
      toast({ title: "공유됨", description: "공유 정보가 준비되었습니다." })
    } catch (e: any) {
      toast({ title: "공유 오류", description: e?.message || "Unknown error", variant: "destructive" })
    }
  }

  return (
    <div ref={containerRef} className="h-[calc(100vh-4rem)] w-full flex gap-2 p-4 select-none">
      {/* Left panel: chat */}
      <section className="h-full" style={{ width: `${splitPct}%` }}>
        {/* Chat timeline */}
        <Card className="flex flex-col h-full relative">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {editingTitle ? (
                <>
                  <input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); renameCurrentTaskTitle(taskTitle.trim()); setEditingTitle(false) }
                      if (e.key === 'Escape') { e.preventDefault(); setTaskTitle(prevTitleRef.current); setEditingTitle(false) }
                    }}
                    className="border rounded-md px-2 py-1 text-sm w-56 md:w-72 bg-background"
                    aria-label={t('작업 제목 입력') || '작업 제목 입력'}
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" title={t('저장') || '저장'} aria-label={t('저장') || '저장'} onClick={() => { renameCurrentTaskTitle(taskTitle.trim()); setEditingTitle(false) }}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" title={t('취소') || '취소'} aria-label={t('취소') || '취소'} onClick={() => { setTaskTitle(prevTitleRef.current); setEditingTitle(false) }}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <CardTitle className="text-base truncate" title={taskTitle || (t('제목 없음') || '제목 없음')}>{taskTitle || (t('제목 없음') || '제목 없음')}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" title={t('제목 변경') || '제목 변경'} aria-label={t('제목 변경') || '제목 변경'} onClick={() => { prevTitleRef.current = taskTitle; setEditingTitle(true) }}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title={t('삭제') || '삭제'} aria-label={t('삭제') || '삭제'} onClick={() => deleteCurrentTask()}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button title="Mermaid 엔진" aria-label="Mermaid 엔진" size="sm" variant={engine === "mermaid" ? "default" : "outline"} onClick={() => setEngine("mermaid")}>Mermaid</Button>
              <Button title="vis.js 엔진" aria-label="vis.js 엔진" size="sm" variant={engine === "visjs" ? "default" : "outline"} onClick={() => setEngine("visjs")}>vis.js</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Timeline */}
            <div ref={timelineRef} className="flex-1 overflow-auto space-y-4 pr-1">
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground">프롬프트를 입력해 차트를 생성하세요.</div>
              )}
              {(() => {
                const seenRoots = new Set<string>()
                return messages.map(m => {
                  // Non-code or error messages stay simple
                  if (!(m.role === 'assistant' && m.kind === 'code' && m.codeVersionId)) {
                    const bubbleWidth = m.role === 'user' ? '65%' : '70%'
                    return (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => { setSelectedMessageId(m.id) }}
                          onKeyDown={(e) => { if (e.key === 'Enter') setSelectedMessageId(m.id) }}
                          className={`group relative overflow-visible w-full rounded-md border p-3 outline-none transition-colors ${
                            m.role === 'user' 
                              ? 'bg-[var(--color-amber)]/10 hover:bg-[var(--color-amber)]/15' 
                              : 'bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15'
                          } ${selectedMessageId === m.id ? 'ring-2 ring-ring' : ''}`}
                          style={{ borderColor: 'var(--color-border)', width: bubbleWidth, maxWidth: '720px' }}
                        >
                          {m.kind === 'error' ? (
                            <div>
                              <Badge variant="destructive">안내</Badge>
                              <div className="text-sm mt-2">{m.text}</div>
                            </div>
                          ) : (
                            <>
                              {m.role === 'user' ? (
                                <>
                                  {editingMessageId === m.id ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={messageDraft}
                                        onChange={(e) => setMessageDraft(e.target.value)}
                                        className="min-h-[80px]"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); cancelEditUserMessage() }}>취소</Button>
                                        <Button size="sm" onClick={(e) => { e.stopPropagation(); saveUserMessageEdit(m.id) }}>저장</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                                      <div
                                        className={`${(actionBarFor === m.id || openDeleteFor === m.id) ? 'flex' : 'hidden group-hover:flex group-focus-within:flex'} items-center gap-1 absolute -bottom-8 left-2 bg-background/95 border rounded-md px-1.5 py-1 shadow z-10`}
                                        onMouseEnter={() => setActionBarFor(m.id)}
                                        onMouseLeave={() => setActionBarFor(prev => prev === m.id ? null : prev)}
                                      >
                                        <Button size="icon" variant="ghost" title="복사" aria-label="복사" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(m.text || ''); toast({ title: '복사됨', description: '질문이 복사되었습니다.' }) }}>
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" title="편집" aria-label="편집" onClick={(e) => { e.stopPropagation(); startEditUserMessage(m.id) }}>
                                          <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <Popover open={openDeleteFor === m.id} onOpenChange={(open) => setOpenDeleteFor(open ? m.id : (openDeleteFor === m.id ? null : openDeleteFor))}>
                                          <PopoverTrigger asChild>
                                            <Button size="icon" variant="ghost" title="삭제" aria-label="삭제" onClick={(e) => { e.stopPropagation(); setOpenDeleteFor(m.id); setActionBarFor(m.id) }}>
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-56" side="top" align="start" onClick={(e) => e.stopPropagation()} onMouseEnter={() => setActionBarFor(m.id)} onMouseLeave={() => setActionBarFor(prev => prev === m.id ? null : prev)}>
                                            <div className="text-sm mb-2">정말 삭제하시겠습니까?</div>
                                            <div className="flex justify-end gap-2">
                                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpenDeleteFor(null); (document.activeElement as HTMLElement)?.blur() }}>취소</Button>
                                              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteUserMessage(m.id); setOpenDeleteFor(null) }}>삭제</Button>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    </>
                                  )}
                                </>
                              ) : (
                                renderMessageContent(m.text)
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  }

                  // Group applied revisions by rootId
                  const v = versions.find(v => v.id === m.codeVersionId)
                  if (!v) return null
                  const rootId = v.rootId || v.id
                  if (seenRoots.has(rootId)) return null
                  seenRoots.add(rootId)
                  // 루트 내 모든 리비전(초안 포함)
                  const revisionsAll = versions
                    .filter(x => (x.rootId || x.id) === rootId)
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  const appliedRevisions = revisionsAll.filter(r => r.status === 'applied')
                  // 선택된 리비전이 이 루트에 속하면 우선 사용, 없으면 마지막 적용 리비전 사용
                  const selectedInRoot = selectedVersion && (selectedVersion.rootId || selectedVersion.id) === rootId ? selectedVersion : null
                  const activeRevisionId = selectedInRoot?.id || openRevisionByRoot[rootId] || appliedRevisions[appliedRevisions.length - 1]?.id || v.id
                  const activeRevision = revisionsAll.find(r => r.id === activeRevisionId) || v
                  const isOpen = (openRootId ?? rootId) === rootId

                  const statusClass = activeRevision && renderStatusRef.current[activeRevision.id] === 'error'
                    ? 'border-2 border-red-500'
                    : activeRevision && renderStatusRef.current[activeRevision.id] === 'ok'
                      ? 'border-2 border-green-500'
                      : ''
                  const displayedRevisions = appliedRevisions.slice(Math.max(0, appliedRevisions.length - 5))
                  const isDraftOpen = activeRevision?.status === 'draft'
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div
                        role="group"
                        tabIndex={0}
                        onClick={() => { setSelectedMessageId(m.id); if (activeRevision) { setSelectedVersionId(activeRevision.id); setOpenRootId(rootId) } }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedMessageId(m.id); if (activeRevision) { setSelectedVersionId(activeRevision.id); setOpenRootId(rootId) } } }}
                        className={`w-full rounded-md border p-3 bg-background outline-none ${selectedMessageId === m.id ? 'ring-2 ring-ring' : ''} ${statusClass}`}
                        style={{ borderColor: 'var(--color-border)', width: isDraftOpen ? '100%' : '70%', maxWidth: isDraftOpen ? '100%' : '720px' }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">
                                {(activeRevision.engine === 'mermaid') ? 'Mermaid' : 'Graphviz'}
                              </Badge>
                              {!isDraftOpen && displayedRevisions.map((r, idx) => {
                                const isActive = activeRevisionId === r.id
                                const opacity = [40, 60, 80, 90, 100][idx] || 80
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    title={`리비전 ${appliedRevisions.indexOf(r) + 1}`}
                                    className={`h-2.5 w-2.5 rounded-full ${isActive ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                                    style={{ background: 'currentColor', opacity: opacity / 100 }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setOpenRevisionByRoot(prev => ({ ...prev, [rootId]: r.id }))
                                      setSelectedMessageId(m.id)
                                      setSelectedVersionId(r.id)
                                      setOpenRootId(rootId)
                                    }}
                                    aria-pressed={isActive}
                                  />
                                )
                              })}
                            </div>
                            <div className="flex items-center gap-1">
                              {!isDraftOpen && (sharedByVersion[activeRevision.id] || sharedByRoot[rootId]) && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button title="공유됨" size="sm" variant="ghost" aria-label="공유됨" onClick={(e) => e.stopPropagation()}>
                                      <Link2 className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80" align="end" onClick={(e) => e.stopPropagation()}>
                                    {(() => {
                                      const s = sharedByVersion[activeRevision.id] || sharedByRoot[rootId]!
                                      return (
                                        <div className="space-y-3">
                                          <div className="text-sm font-medium truncate">{s.title || '공유된 차트'}</div>
                                          <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground">URL</div>
                                            <div className="flex items-center gap-2">
                                              <Input value={s.url} readOnly className="h-8 text-xs" />
                                              <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { navigator.clipboard.writeText(s.url); toast({ title: '복사됨', description: 'URL이 복사되었습니다.' }) }}>
                                                <Copy className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground">PIN</div>
                                            <div className="flex items-center gap-2">
                                              <Input value={s.pin} readOnly className="h-8 text-xs font-mono" />
                                              <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { navigator.clipboard.writeText(s.pin); toast({ title: '복사됨', description: 'PIN이 복사되었습니다.' }) }}>
                                                <Copy className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })()}
                                  </PopoverContent>
                                </Popover>
                              )}
                              {!isDraftOpen && (
                                <>
                                  <Button title="코드 편집" size="sm" variant="ghost" aria-label="코드 편집" onClick={(e) => { e.stopPropagation(); if (activeRevision) startEdit(activeRevision.id) }}>
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button title="코드 복사" size="sm" variant="ghost" aria-label="코드 복사" onClick={(e) => { e.stopPropagation(); if (activeRevision) copyCode(activeRevision.id) }}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {isDraftOpen && (
                                <div className="ml-auto flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); cancelDraft(activeRevision.id) }}>취소</Button>
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); applyDraft(activeRevision.id, draftValue) }}>적용</Button>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Active code preview or inline editor */}
                          {isDraftOpen ? (
                            <Textarea
                              value={draftValue}
                              onChange={(e) => setDraftValue(e.target.value)}
                              className="w-full h-[50vh]"
                              aria-label="코드 편집기"
                            />
                          ) : (
                            <CodePreview code={stripCodeFenceLocal(activeRevision.code)} open={isOpen} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            {/* 인라인 드래프트 편집으로 전환됨 (별도 에디터 제거) */}

            {/* Suggestions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <Button key={i} size="sm" variant="outline" onClick={() => setInput(prev => (prev ? prev + "\n" + s : s))}>
                  <Sparkles className="h-4 w-4 mr-1" /> {s}
                </Button>
              ))}
              {intent && <span className="text-xs px-2 py-1 rounded-full bg-muted text-foreground">의도: {intent}</span>}
            </div>

            {/* Input bar */}
            <div className="mt-3 flex items-end gap-2">
              <Textarea
                aria-label="프롬프트 입력"
                placeholder="예: 지난 12개월 매출 라인 차트를 만들어줘"
                className="flex-1 min-h-[80px]"
                id="prompt-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    const trimmedInput = input.trim()
                    if (trimmedInput && !sending && !sendingRef.current) {
                      generateFromPrompt(trimmedInput)
                    }
                  }
                }}
              />
              <Button 
                disabled={sending || !input.trim()} 
                onClick={() => {
                  const trimmedInput = input.trim()
                  if (trimmedInput && !sending && !sendingRef.current) {
                    generateFromPrompt(trimmedInput)
                  }
                }}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-2">생성</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Resizer */}
      <div
        className="w-1 bg-border cursor-col-resize rounded-md" role="separator" aria-orientation="vertical"
        onMouseDown={onHDragStart}
        onMouseMove={onHDragMove}
        onMouseUp={onHDragEnd}
      />

      {/* Right panel: canvas */}
      <aside className="h-full flex-1">
        <Card className="flex h-full flex-col">
          <CardHeader className="w-full border-b px-4 py-3">
            <div className="flex w-full items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
              <CardTitle className="text-base flex-shrink-0">캔버스</CardTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  title="PNG로 저장"
                  aria-label="PNG로 저장"
                  size="sm"
                  variant="outline"
                  disabled={downloading.png}
                  onClick={(event) => {
                    triggerRipple(event)
                    void exportPNG()
                  }}
                  data-ripple-color="rgba(255,255,255,0.45)"
                  className={cn(
                    "canvas-action-btn canvas-action-btn--png",
                    downloading.png && "is-loading"
                  )}
                >
                  {downloading.png ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-1 h-4 w-4" />} PNG
                </Button>
                <Button
                  title="SVG로 저장"
                  aria-label="SVG로 저장"
                  size="sm"
                  variant="outline"
                  disabled={downloading.svg}
                  onClick={(event) => {
                    triggerRipple(event)
                    void exportSVG()
                  }}
                  data-ripple-color="rgba(255,255,255,0.38)"
                  className={cn(
                    "canvas-action-btn canvas-action-btn--svg",
                    downloading.svg && "is-loading"
                  )}
                >
                  {downloading.svg ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />} SVG
                </Button>
                <Button
                  title="이미지 복사"
                  aria-label="이미지 복사"
                  size="sm"
                  variant="outline"
                  disabled={downloading.copy}
                  onClick={(event) => {
                    triggerRipple(event)
                    void exportCopyImage()
                  }}
                  data-ripple-color="rgba(255,255,255,0.4)"
                  className={cn(
                    "canvas-action-btn canvas-action-btn--copy",
                    downloading.copy && "is-loading"
                  )}
                >
                  {downloading.copy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Copy className="mr-1 h-4 w-4" />} 복사
                </Button>
                <Button title="코드 파일 저장" aria-label="코드 파일 저장" size="sm" variant="outline" onClick={() => selectedVersionId && exportCode(selectedVersionId)}>
                  <FileCode2 className="h-4 w-4 mr-1" /> 코드
                </Button>
                <Popover open={!!shareInfo}>
                  <PopoverTrigger asChild>
                    <Button title="공유하기" aria-label="공유하기" size="sm" variant="default" onClick={() => {
                      // 현재 선택 상태 확인
                      const v = selectedVersion
                      const rootId = v?.rootId || v?.id || null
                      const existing = (v && sharedByVersion[v.id]) || (rootId ? sharedByRoot[rootId] : null)

                      if (existing) {
                        // 이미 공유된 경우: 확인 팝오버 오픈
                        setExistingShared(existing)
                        setShareTitleDraft(existing.title || '')
                        setShareInfo({ id: '', pin: '', url: '', title: existing.title })
                        setShareMode('conflict')
                        return
                      }

                      // 신규 공유: 제목 입력 폼 오픈
                      const ordinal = getChartOrdinalWithinTask()
                      const defaultTitle = `${taskTitle || '새작업'}의 ${ordinal}번째 차트`
                      setExistingShared(null)
                      setShareTitleDraft(defaultTitle)
                      setShareInfo({ id: '', pin: '', url: '', title: defaultTitle })
                      setShareMode('form')
                    }}>
                      <Share2 className="h-4 w-4 mr-1" /> 공유
                    </Button>
                  </PopoverTrigger>
                  {shareInfo && (
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        {shareMode === 'conflict' && existingShared ? (
                          <div className="space-y-3">
                            <div className="text-sm">이미 공유된 차트입니다. 수정하시겠어요?</div>
                            <div className="text-xs text-muted-foreground break-all">
                              <div className="truncate"><strong>제목:</strong> {existingShared.title}</div>
                              <div className="truncate"><strong>URL:</strong> {existingShared.url}</div>
                              <div><strong>PIN:</strong> {existingShared.pin}</div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="default" onClick={() => { setShareMode('form') }}>수정</Button>
                              <Button size="sm" variant="destructive" onClick={() => {
                                try {
                                  const raw = localStorage.getItem('shared.list')
                                  const list: SharedRecord[] = raw ? JSON.parse(raw) : []
                                  const next = list.filter(x => x.id !== existingShared.id)
                                  localStorage.setItem('shared.list', JSON.stringify(next))
                                  window.dispatchEvent(new CustomEvent('shared:updated'))
                                  toast({ title: '공유삭제', description: '공유 항목이 목록에서 제거되었습니다.' })
                                } catch {}
                                setExistingShared(null)
                                setShareMode(null)
                                setShareInfo(null)
                              }}>공유삭제</Button>
                              <Button size="sm" variant="ghost" onClick={() => { setShareMode(null); setExistingShared(null); setShareInfo(null) }}>나가기</Button>
                            </div>
                          </div>
                        ) : shareMode === 'form' ? (
                          <>
                            <div className="space-y-2">
                              <h4 className="font-medium">공유 설정</h4>
                              <div className="grid gap-2">
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">차트 이름</div>
                                  <Input
                                    value={shareTitleDraft}
                                    onChange={(e) => setShareTitleDraft(e.target.value)}
                                    placeholder="차트 이름을 입력하세요"
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => { setShareMode(null); setShareInfo(null); setExistingShared(null) }}>취소</Button>
                              <Button size="sm" onClick={async () => {
                                await onShare()
                                setShareMode('result')
                              }}>공유</Button>
                            </div>
                          </>
                        ) : shareMode === 'result' && shareInfo?.id ? (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">공유 정보</div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Input value={shareInfo.title || ''} readOnly className="h-8 text-xs" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Input value={shareInfo.url} readOnly className="h-8 text-xs" />
                                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { navigator.clipboard.writeText(shareInfo.url); toast({ title: '복사됨', description: 'URL이 복사되었습니다.' }) }}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input value={shareInfo.pin} readOnly className="h-8 text-xs font-mono" />
                                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { navigator.clipboard.writeText(shareInfo.pin); toast({ title: '복사됨', description: 'PIN이 복사되었습니다.' }) }}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            {!selectedVersion ? (
              <div className="flex flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
                프롬프트로 차트를 생성하거나 채팅 내역에서 코드 버블을 선택하세요.
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center overflow-hidden">
                {workspaceMode === 'guest' ? (
                  <GuestCanvas
                    ref={guestCanvasRef as any}
                    code={selectedVersion.status === 'draft' ? (livePreviewCode || selectedVersion.code) : selectedVersion.code}
                    engine={selectedVersion.status === 'draft' ? (livePreviewEngine || selectedVersion.engine) : selectedVersion.engine}
                    title={selectedVersion.title}
                    onRendered={onCanvasRendered}
                  />
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    회원 편집 모드는 React Flow 기반으로 구현 예정입니다.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}

function CodePreview({ code, open: controlledOpen }: { code: string; open?: boolean }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? (controlledOpen as boolean) : uncontrolledOpen
  const lines = code.split('\n')
  const preview = lines.slice(0, 8).join('\n') + (lines.length > 8 ? '\n…' : '')
  return (
    <div>
      <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-48 whitespace-pre-wrap">
        {open ? code : preview}
      </pre>
      {!isControlled && (
        <div className="mt-1 text-right">
          <Button size="sm" variant="ghost" onClick={() => setUncontrolledOpen(o => !o)}>{open ? '접기' : '전체보기'}</Button>
        </div>
      )}
    </div>
  )
}

// 고유 ID 생성 함수
function uid(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 프롬프트 요약 함수
function summarizePrompt(text: string): string {
  return text.length > 30 ? text.substring(0, 30) + '...' : text
}
