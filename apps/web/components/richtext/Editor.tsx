"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

export function RichTextEditor({ content = "", className }: { content?: string; className?: string }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
  })

  return (
    <div className={"rounded-md border bg-card p-2 " + (className ?? "")}>
      <EditorContent editor={editor} />
    </div>
  )
}
