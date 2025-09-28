"use client"

export const dynamic = "force-dynamic"

import { useAuth } from "@/lib/fastapi-auth"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ExternalLink,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Loader2,
  Plus,
  BarChart3,
  Share2,
  Settings
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getEntitlements } from "@/lib/entitlements"
import Link from "next/link"

export default function HomePage() {
  const { user, isLoading, isAuthenticated, mounted } = useAuth()
  const [entitlements, setEntitlements] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      const userEntitlements = getEntitlements(user.plan)
      setEntitlements(userEntitlements)
    }
  }, [user])

  // Hydration 오류 방지: 클라이언트 마운트 전에는 로딩 상태 유지
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>로그인이 필요합니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              이 페이지에 접근하려면 로그인이 필요합니다.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">로그인하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'USER': return <Badge variant="secondary">사용자</Badge>
      case 'ADMIN': return <Badge className="bg-blue-500 hover:bg-blue-500/80 text-primary-foreground">관리자</Badge>
      case 'OWNER': return <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-primary-foreground">소유자</Badge>
      default: return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'free': return <Badge variant="secondary">Free</Badge>
      case 'pro': return <Badge className="bg-green-500 hover:bg-green-500/80 text-primary-foreground">Pro</Badge>
      case 'team': return <Badge className="bg-purple-500 hover:bg-purple-500/80 text-primary-foreground">Team</Badge>
      default: return <Badge variant="secondary">{plan}</Badge>
    }
  }

  return (
    <div className="p-4">
      {/* 환영 메시지 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          안녕하세요, {user.name}님! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          AI 기반 다이어그램 생성 도구에 오신 것을 환영합니다.
        </p>
      </div>

      {/* 사용자 정보 카드 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            계정 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getRoleBadge(user.role)}
              {getPlanBadge(user.plan)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 엔타이틀 정보 */}
      {entitlements && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              플랜 혜택
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">일일 메시지 한도</span>
                <Badge variant="outline">{entitlements.messagesPerDay}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">최대 노드 수</span>
                <Badge variant="outline">{entitlements.maxNodes}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Export 형식</span>
                <Badge variant="outline">{entitlements.exports.join(', ')}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">팀 협업</span>
                <Badge variant={entitlements.collab ? "default" : "secondary"}>
                  {entitlements.collab ? "지원" : "미지원"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">API 액세스</span>
                <Badge variant={entitlements.api !== 'none' ? "default" : "secondary"}>
                  {entitlements.api === 'none' ? "미지원" : entitlements.api}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">퍼블릭 공유</span>
                <Badge variant={entitlements.publicShare ? "default" : "secondary"}>
                  {entitlements.publicShare ? "지원" : "미지원"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 빠른 시작 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              새 다이어그램
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              AI를 활용하여 새로운 다이어그램을 생성해보세요.
            </p>
            <Button className="w-full" asChild>
              <Link href="/app/tasks/new">
                <ArrowRight className="h-4 w-4 mr-2" />
                시작하기
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              통계 보기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              사용량 통계와 활동 내역을 확인하세요.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/app/statistics">
                <BarChart3 className="h-4 w-4 mr-2" />
                통계 보기
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              공유하기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              생성한 다이어그램을 다른 사람과 공유하세요.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/share">
                <Share2 className="h-4 w-4 mr-2" />
                공유 관리
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 업그레이드 안내 */}
      {user.plan === 'free' && (
        <Card className="mt-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Zap className="h-5 w-5" />
              Pro로 업그레이드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              더 많은 기능과 높은 한도를 원하시나요? Pro 플랜으로 업그레이드하세요.
            </p>
            <Button className="bg-green-600 hover:bg-green-700" asChild>
              <Link href="/pricing">
                <ArrowRight className="h-4 w-4 mr-2" />
                업그레이드하기
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}