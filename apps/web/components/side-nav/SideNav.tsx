// Server Component: Notion-like fixed sidebar wrapper

import { SideNavClient } from "./SideNavClient"

export function SideNav() {
  return (
    <aside className="hidden md:block bg-card border-r h-screen">
      <SideNavClient />
    </aside>
  )
}
