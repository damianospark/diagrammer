"use client"

export const dynamic = "force-dynamic"

import { useAuth } from "@/lib/fastapi-auth"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Loader2,
  TrendingUp,
  Calendar,
  Activity,
  Users
} from "lucide-react"

export default function StatisticsPage() {
  const { user, isLoading, isAuthenticated, mounted } = useAuth()
  const [stats, setStats] = useState({
    totalDiagrams: 0,
    thisMonth: 0,
    lastMonth: 0,
    totalMessages: 0,
    avgResponseTime: 0
  })

  useEffect(() => {
    // 임시 통계 데이터 (실제로는 API에서 가져와야 함)
    setStats({
      totalDiagrams: 24,
      thisMonth: 8,
      lastMonth: 16,
      totalMessages: 156,
      avgResponseTime: 2.3
    })
  }, [])

  // Hydration 오류 방지: 클라이언트 마운트 전에는 로딩 상태 유지
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">
            통계를 보려면 로그인해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          사용량 통계
        </h1>
        <p className="text-muted-foreground">
          다이어그램 생성 활동과 사용량을 확인하세요.
        </p>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 다이어그램</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDiagrams}</div>
            <p className="text-xs text-muted-foreground">
              지금까지 생성한 다이어그램 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              이번 달 생성한 다이어그램
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 메시지</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              AI와 주고받은 메시지 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 응답 시간</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}초</div>
            <p className="text-xs text-muted-foreground">
              AI 응답 평균 시간
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 월별 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>월별 다이어그램 생성 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">이번 달</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.thisMonth}</span>
                  <Badge variant="outline">+{stats.thisMonth}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">지난 달</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.lastMonth}</span>
                  <Badge variant="secondary">{stats.lastMonth}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>플랜 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">현재 플랜</span>
                <Badge variant={user.plan === 'free' ? 'secondary' : 'default'}>
                  {user.plan?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">사용량</span>
                <span className="text-sm font-medium">
                  {stats.totalMessages} / {user.plan === 'free' ? '100' : user.plan === 'pro' ? '2000' : '10000'} 메시지
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min((stats.totalMessages / (user.plan === 'free' ? 100 : user.plan === 'pro' ? 2000 : 10000)) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">새 다이어그램 생성</p>
                <p className="text-xs text-muted-foreground">2시간 전</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">다이어그램 수정</p>
                <p className="text-xs text-muted-foreground">1일 전</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">다이어그램 공유</p>
                <p className="text-xs text-muted-foreground">3일 전</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
