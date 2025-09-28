"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Settings,
  Flag,
  Activity,
  Shield
} from "lucide-react"

const adminNavItems = [
  {
    title: "대시보드",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "사용자",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "조직",
    href: "/admin/organizations",
    icon: Building2
  },
  {
    title: "결제",
    href: "/admin/billing",
    icon: CreditCard
  },
  {
    title: "플랜",
    href: "/admin/plans",
    icon: Settings
  },
  {
    title: "감사 로그",
    href: "/admin/audit",
    icon: Activity
  },
  {
    title: "기능 플래그",
    href: "/admin/features",
    icon: Flag
  },
  {
    title: "통합",
    href: "/admin/integrations",
    icon: Shield
  }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold">관리자</h2>
        <p className="text-sm text-muted-foreground">Diagrammer</p>
      </div>

      <nav className="px-3 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive && "bg-secondary"
              )}
            >
              <Link href={item.href}>
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
