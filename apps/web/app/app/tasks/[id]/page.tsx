"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import Workspace from "@/components/workspace/Workspace"

export default function TaskWorkspacePage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string

  useEffect(() => {
    if (!id) return
    try {
      localStorage.setItem('tasks.currentId', id)
      const ev = new CustomEvent('tasks:select', { detail: { id } })
      window.dispatchEvent(ev)
    } catch { }
  }, [id])

  return <Workspace />
}
