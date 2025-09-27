"use client"

import * as React from "react"

// Placeholder uploader; integrate UploadThing server routes later.
export function Uploader({ onFiles }: { onFiles?: (files: FileList | null) => void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm cursor-pointer">
      <input
        type="file"
        className="sr-only"
        onChange={(e) => onFiles?.(e.target.files)}
        multiple
      />
      <span>Upload files</span>
    </label>
  )
}
