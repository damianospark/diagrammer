"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useI18n } from "@/hooks/i18n"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Edit3, FolderKanban, LayoutDashboard, Menu, MoreVertical, PlusCircle, Search as SearchIcon, Share2 as ShareIcon, Trash2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"


type Task = {
  id: string
  title: string
  createdAt: string
  messages?: { role: 'user' | 'assistant'; content: string }[]
}

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tasks", href: "/tasks", icon: FolderKanban },
  { label: "Shared Charts", href: "/shared", icon: ShareIcon },
]

export function SideNavClient() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [shared, setShared] = useState<Array<{ id: string; pin: string; title: string; url: string; createdAt: string }>>([])
  const [renamingSharedId, setRenamingSharedId] = useState<string | null>(null)
  const [renameSharedDraft, setRenameSharedDraft] = useState<string>("")
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [renamingTaskId, setRenamingTaskId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState<string>("")

  // load persisted collapsed state
  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar.collapsed')
      if (v != null) setCollapsed(v === '1')
    } catch {}
  }, [])

  function saveShared(next: Array<{ id: string; pin: string; title: string; url: string; createdAt: string }>) {
    setShared(next)
    try {
      localStorage.setItem('shared.list', JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('shared:updated'))
    } catch {}
  }

  // listen current task changes
  useEffect(() => {
    const onSelect = (e: Event) => {
      try { setCurrentTaskId((e as CustomEvent).detail?.id || null) } catch {}
    }
    const onNew = (e: Event) => {
      try { setCurrentTaskId((e as CustomEvent).detail?.id || null) } catch {}
    }
    window.addEventListener('tasks:select' as any, onSelect as any)
    window.addEventListener('tasks:new' as any, onNew as any)
    return () => {
      window.removeEventListener('tasks:select' as any, onSelect as any)
      window.removeEventListener('tasks:new' as any, onNew as any)
    }
  }, [])

  // persist collapsed state
  useEffect(() => {
    try { localStorage.setItem('sidebar.collapsed', collapsed ? '1' : '0') } catch {}
  }, [collapsed])

  // load tasks
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tasks.list')
      if (raw) setTasks(JSON.parse(raw))
      const cur = localStorage.getItem('tasks.currentId')
      if (cur) setCurrentTaskId(cur)
    } catch {}
  }, [])

  // refresh tasks on same-tab updates
  useEffect(() => {
    const reload = () => {
      try {
        const raw = localStorage.getItem('tasks.list')
        setTasks(raw ? JSON.parse(raw) : [])
      } catch {}
    }
    window.addEventListener('tasks:updated' as any, reload as any)
    return () => window.removeEventListener('tasks:updated' as any, reload as any)
  }, [])

  // load shared links
  useEffect(() => {
    try {
      const raw = localStorage.getItem('shared.list')
      if (raw) setShared(JSON.parse(raw))
    } catch {}
  }, [])

  // refresh shared on same-tab updates
  useEffect(() => {
    const reload = () => {
      try {
        const raw = localStorage.getItem('shared.list')
        setShared(raw ? JSON.parse(raw) : [])
      } catch {}
    }
    window.addEventListener('shared:updated' as any, reload as any)
    return () => window.removeEventListener('shared:updated' as any, reload as any)
  }, [])

  function saveTasks(next: Task[]) {
    setTasks(next)
    try {
      localStorage.setItem('tasks.list', JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('tasks:updated'))
    } catch {}
  }
  
  function updateTask(taskId: string, patch: Partial<Task>) {
    if (!tasks.some(t => t.id === taskId)) return
    const next = tasks.map(t => (t.id === taskId ? { ...t, ...patch } : t))
    saveTasks(next)
  }
  
  function deleteTask(taskId: string) {
    if (!tasks.some(t => t.id === taskId)) return
    const next = tasks.filter(t => t.id !== taskId)
    saveTasks(next)
  
    if (renamingTaskId === taskId) {
      setRenamingTaskId(null)
      setRenameDraft("")
    }
  
    if (currentTaskId === taskId) {
      const fallback = next[0]
      if (fallback) {
        selectTask(fallback.id)
      } else {
        try { localStorage.removeItem('tasks.currentId') } catch {}
        setCurrentTaskId(null)
        window.dispatchEvent(new CustomEvent('tasks:select', { detail: { id: null } }))
        router.push('/tasks')
      }
    }
  }
  
  function nextTaskTitle(): string {
    try {
      const n = Number(localStorage.getItem('tasks.next') || '1')
      localStorage.setItem('tasks.next', String(n + 1))
      return `새작업 ${n}`
    } catch {
      return '새작업'
    }
  }

  function createNewTask() {
    const title = nextTaskTitle()
    const id = crypto?.randomUUID?.() || `${Date.now()}`
    const task: Task = { id, title, createdAt: new Date().toISOString(), messages: [] }
    const next = [task, ...tasks]
    saveTasks(next)
    try {
      localStorage.setItem('tasks.currentId', id)
      const ev = new CustomEvent('tasks:new', { detail: { id } })
      window.dispatchEvent(ev)
    } catch {}
    // 이동: 해당 작업 세션 페이지
    router.push(`/tasks/${id}`)
  }

  function selectTask(id: string) {
    try {
      localStorage.setItem('tasks.currentId', id)
      const ev = new CustomEvent('tasks:select', { detail: { id } })
      window.dispatchEvent(ev)
    } catch {}
    // 이동: 해당 작업 세션 페이지
    router.push(`/tasks/${id}`)
  }

  const renderNav = (onNavigate?: () => void) => (
    <nav role="navigation" aria-label="Main" className="space-y-1">
      {/* Dashboard first */}
      {(() => {
        const { label, href, icon: Icon } = navItems[0]
        const isActive = pathname === href
        return (
          <Button
            key={href}
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start rounded-[var(--radius)]",
              "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
              isActive
                ? "font-semibold border-l-2 border-[var(--color-primary)] bg-[var(--bg-e2)] shadow-[0_0_10px_var(--color-primary)/0.12]"
                : "text-muted-foreground hover:bg-[var(--bg-e2)]"
            )}
            onClick={onNavigate}
          >
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              className={cn("flex items-center gap-2 w-full", collapsed && "justify-center")}
            >
              <Icon className="h-4 w-4" />
              <span className={collapsed ? "sr-only" : ""}>{t('Tasks') || label}</span>
            </Link>
          </Button>
        )
      })()}

      {/* Under Dashboard: New Task, Search */}
      <div className="mt-2 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start rounded-[var(--radius)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
            "text-muted-foreground hover:bg-[var(--bg-e2)]"
          )}
          onClick={() => { createNewTask(); onNavigate?.() }}
        >
          <span className={cn("flex items-center gap-2 w-full", collapsed && "justify-center")}>
            <PlusCircle className="h-4 w-4" />
            <span className={collapsed ? "sr-only" : ""}>{t('New Task') || 'New Task'}</span>
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start rounded-[var(--radius)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
            "text-muted-foreground hover:bg-[var(--bg-e2)]"
          )}
          onClick={() => { setSearchOpen(true); onNavigate?.() }}
        >
          <span className={cn("flex items-center gap-2 w-full", collapsed && "justify-center")}>
            <SearchIcon className="h-4 w-4" />
            <span className={collapsed ? "sr-only" : ""}>{t('Search') || 'Search'}</span>
          </span>
        </Button>
      </div>

      {/* Tasks item */}
      {(() => {
        const { label, href, icon: Icon } = navItems[1]
        const isActive = pathname?.startsWith(href)
        return (
          <Button
            key={href}
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start rounded-[var(--radius)]",
              "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
              isActive
                ? "font-semibold border-l-2 border-[var(--color-primary)] bg-[var(--bg-e2)] shadow-[0_0_10px_var(--color-primary)/0.12]"
                : "text-muted-foreground hover:bg-[var(--bg-e2)]"
            )}
            onClick={onNavigate}
          >
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              className={cn("flex items-center gap-2 w-full", collapsed && "justify-center")}
            >
              <Icon className="h-4 w-4" />
              <span className={collapsed ? "sr-only" : ""}>{label}</span>
            </Link>
          </Button>
        )
      })()}

      {/* Tasks dynamic children under Tasks */}
      <div className="mt-1 ml-3 border-l pl-2" style={{ borderColor: 'var(--color-border)' }}>
        <div className="space-y-1">
          {tasks.length === 0 && !collapsed && (
            <div className="px-3 text-xs text-muted-foreground">{t('작업이 없습니다') || '작업이 없습니다'}</div>
          )}
          {tasks.map(task => {
            const active = currentTaskId === task.id || pathname === `/tasks/${task.id}`
            const isRenaming = renamingTaskId === task.id

            const commitRename = () => {
              const nextTitle = renameDraft.trim()
              if (!nextTitle) {
                setRenamingTaskId(null)
                setRenameDraft("")
                return
              }
              if (nextTitle !== task.title) {
                updateTask(task.id, { title: nextTitle })
              }
              setRenamingTaskId(null)
              setRenameDraft("")
            }

            const cancelRename = () => {
              setRenamingTaskId(null)
              setRenameDraft("")
            }

            return (
              <div
                key={task.id}
                className={cn(
                  "group flex items-center gap-1 rounded-[var(--radius)] px-1 py-1 transition-colors",
                  active && "border-l-2 border-[var(--color-primary)] bg-[var(--bg-e2)] font-semibold"
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-[var(--radius)] px-2 py-1 text-left text-xs",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                    !active && "hover:bg-[var(--bg-e2)]"
                  )}
                  onClick={() => { if (!isRenaming) selectTask(task.id) }}
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                  {isRenaming ? (
                    <input
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); commitRename() }
                        if (e.key === 'Escape') { e.preventDefault(); cancelRename() }
                      }}
                      onBlur={commitRename}
                      autoFocus
                      className="w-full rounded-sm border border-[var(--color-border)] bg-background px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className={collapsed ? "sr-only" : "truncate"}>{task.title}</span>
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault()
                        setRenamingTaskId(task.id)
                        setRenameDraft(task.title)
                      }}
                    >
                      <Edit3 className="mr-2 h-3 w-3" /> {t('이름 바꾸기') || '이름 바꾸기'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(event) => {
                        event.preventDefault()
                        const confirmed = window.confirm(t('정말 이 작업을 삭제할까요?') || '정말 이 작업을 삭제할까요?')
                        if (confirmed) deleteTask(task.id)
                      }}
                    >
                      <Trash2 className="mr-2 h-3 w-3" /> {t('삭제하기') || '삭제하기'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </div>

      {/* Shared Charts item */}
      {(() => {
        const { label, href, icon: Icon } = navItems[2]
        const isActive = pathname?.startsWith(href) || pathname?.startsWith('/s/')
        return (
          <Button
            key={href}
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start rounded-[var(--radius)]",
              "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
              isActive
                ? "font-semibold border-l-2 border-[var(--color-primary)] bg-[var(--bg-e2)] shadow-[0_0_10px_var(--color-primary)/0.12]"
                : "text-muted-foreground hover:bg-[var(--bg-e2)]"
            )}
            onClick={onNavigate}
          >
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              className={cn("flex items-center gap-2 w-full", collapsed && "justify-center")}
            >
              <Icon className="h-4 w-4" />
              <span className={collapsed ? "sr-only" : ""}>{label}</span>
            </Link>
          </Button>
        )
      })()}

      {/* Shared Charts children list */}
      <div className="mt-1 ml-3 border-l pl-2 space-y-1" style={{ borderColor: 'var(--color-border)' }}>
        {shared.length === 0 && !collapsed && (
          <div className="px-3 text-xs text-muted-foreground">{t('아직 공유된 페이지가 없습니다') || '아직 공유된 페이지가 없습니다'}</div>
        )}
        {shared.map(s => {
          const isRenaming = renamingSharedId === s.id
          const commitRenameShared = () => {
            const nextTitle = renameSharedDraft.trim()
            setRenamingSharedId(null)
            setRenameSharedDraft("")
            if (!nextTitle || nextTitle === s.title) return
            const next = shared.map(x => (x.id === s.id ? { ...x, title: nextTitle } : x))
            saveShared(next)
          }
          const cancelRenameShared = () => {
            setRenamingSharedId(null)
            setRenameSharedDraft("")
          }
          return (
            <div key={s.id} className="group flex items-center gap-1 rounded-[var(--radius)] px-1 py-1 hover:bg-[var(--bg-e2)]">
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                title={`PIN: ${s.pin}`}
                className="flex-1 flex items-center gap-2 rounded-[var(--radius)] px-2 py-1 text-left text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <span aria-hidden>🔗</span>
                {isRenaming ? (
                  <input
                    value={renameSharedDraft}
                    onChange={(e) => setRenameSharedDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitRenameShared() }
                      if (e.key === 'Escape') { e.preventDefault(); cancelRenameShared() }
                    }}
                    onBlur={commitRenameShared}
                    autoFocus
                    className="w-full rounded-sm border border-[var(--color-border)] bg-background px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{s.title || s.id}</span>
                )}
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.preventDefault()}
                    aria-label="공유 항목 메뉴"
                    title="공유 항목 메뉴"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      setRenamingSharedId(s.id)
                      setRenameSharedDraft(s.title || '')
                    }}
                  >
                    <Edit3 className="mr-2 h-3 w-3" /> {t('차트 제목 수정') || '차트 제목 수정'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(event) => {
                      event.preventDefault()
                      const confirmed = window.confirm(t('이 공유를 삭제할까요? (로컬 목록에서 제거됩니다)') || '이 공유를 삭제할까요? (로컬 목록에서 제거됩니다)')
                      if (!confirmed) return
                      const next = shared.filter(x => x.id !== s.id)
                      saveShared(next)
                    }}
                  >
                    <Trash2 className="mr-2 h-3 w-3" /> {t('공유 삭제') || '공유 삭제'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>
    </nav>
  )

  return (
    <div className={cn("flex h-full flex-col transition-[width] duration-200 ease-[var(--easing)]", collapsed ? "w-16" : "w-64")}> 
      {/* Top: Logo */}
      <div className="h-16 flex items-center px-2 md:px-4 border-b">
        <span className={cn("text-lg font-semibold text-foreground", collapsed && "sr-only")}>Diagrammer</span>
        {/* Desktop collapse toggle */}
        <div className="ml-auto hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            onClick={() => setCollapsed(v => !v)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        {/* Mobile menu button */}
        <div className="ml-2 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="메뉴 열기">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex h-full flex-col">
                <div className="mb-4 text-base font-semibold">메뉴</div>
                {renderNav(() => setOpen(false))}
                <div className="mt-auto pt-4 border-t">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>G</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">guest</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start" forceMount>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">프로필</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">설정</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>로그아웃</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Middle: Nav */}
      <div className={cn("flex-1 overflow-auto px-3 py-4", collapsed && "px-2")}> 
        {renderNav()}
      </div>

      {/* Bottom: Profile */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("w-full justify-start", collapsed && "justify-center")}> 
              <Avatar className={cn("h-6 w-6", collapsed ? "" : "mr-2")}> 
                <AvatarFallback>G</AvatarFallback>
              </Avatar>
              <span className={cn("text-sm", collapsed && "sr-only")}>guest</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" forceMount>
            <DropdownMenuItem asChild>
              <Link href="/profile">프로필</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">설정</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search sliding panel */}
      {searchOpen && (
        <div
          role="dialog"
          aria-label="Search"
          className="fixed top-16 bottom-0 z-40 w-[420px] bg-card border-l shadow-xl"
          style={{ left: collapsed ? 64 : 256 }}
        >
          <div className="p-3 border-b flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="작업/채팅 검색"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              aria-label="검색"
              autoFocus
            />
            <Button variant="ghost" size="sm" onClick={() => setSearchOpen(false)}>닫기</Button>
          </div>
          <div className="p-3 overflow-auto h-full">
            {(() => {
              const q = query.trim().toLowerCase()
              const results = !q ? [] : tasks.filter(t =>
                t.title.toLowerCase().includes(q) ||
                (Array.isArray(t.messages) && t.messages.some((m: any) => typeof m?.content === 'string' && m.content.toLowerCase().includes(q)))
              )
              return (
                <ul className="space-y-2">
                  {results.length === 0 && q && (
                    <li className="text-xs text-muted-foreground">검색 결과가 없습니다</li>
                  )}
                  {results.map(t => (
                    <li key={t.id}>
                      <button
                        className="w-full text-left px-2 py-2 rounded-md hover:bg-[var(--bg-e2)]"
                        onClick={() => { selectTask(t.id); setSearchOpen(false) }}
                      >
                        <div className="text-sm font-medium">{t.title}</div>
                        {Array.isArray(t.messages) && t.messages.length > 0 && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {t.messages.slice(-3).map((m: any) => m.content).filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
