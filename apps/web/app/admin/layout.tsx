"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { useAuth } from "@/lib/fastapi-auth"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, mounted, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('AdminLayout: useEffect triggered', { mounted, isAuthenticated, user, isLoading, authLoading })

    if (!mounted || authLoading) {
      console.log('AdminLayout: Not ready yet, waiting...', { mounted, authLoading })
      return
    }

    console.log('AdminLayout: mounted:', mounted, 'isAuthenticated:', isAuthenticated, 'user:', user)

    if (!isAuthenticated || !user) {
      console.log('AdminLayout: Not authenticated, redirecting to /login')
      console.log('AdminLayout: isAuthenticated:', isAuthenticated, 'user:', user)
      router.push("/login")
      return
    }

    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      console.log('AdminLayout: Not admin/owner, redirecting to /')
      router.push("/")
      return
    }

    console.log('AdminLayout: Admin access granted')
    setIsLoading(false)
  }, [mounted, isAuthenticated, user, router, authLoading])


  if (!mounted || authLoading || isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>관리자 권한 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (user.role !== "ADMIN" && user.role !== "OWNER") {
    return null
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
