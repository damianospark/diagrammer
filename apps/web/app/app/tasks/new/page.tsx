"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Workspace from "@/components/workspace/Workspace"

export default function NewTaskPage() {
  const router = useRouter()

  useEffect(() => {
    // 새 작업 ID 생성
    const id = crypto?.randomUUID?.() || `${Date.now()}`

    try {
      localStorage.setItem('tasks.currentId', id)
      const ev = new CustomEvent('tasks:new', { detail: { id } })
      window.dispatchEvent(ev)
    } catch { }

    // 새 작업 페이지로 리다이렉트
    router.replace(`/app/tasks/${id}`)
  }, [router])

  return (
    <div className="p-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">새 작업을 생성하고 있습니다...</h2>
          <p className="text-muted-foreground">잠시만 기다려주세요.</p>
        </div>
      </div>
    </div>
  )
}
