"use client"

import * as React from "react"
import { Command } from "cmdk"

export function CommandPalette({
  open,
  onOpenChange,
  commands = [],
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  commands?: { id: string; label: string; action: () => void }[]
}) {
  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange} label="Command Menu">
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Commands">
          {commands.map((cmd) => (
            <Command.Item key={cmd.id} onSelect={cmd.action}>
              {cmd.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
