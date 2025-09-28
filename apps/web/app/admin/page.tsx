import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminStats, QuickStats, SystemHealth } from "@/components/admin/AdminStats"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboard() {
  const [userCount, billingCount, orgCount, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.billingProfile.count(),
    prisma.organization.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } })
  ])

  const stats = {
    totalUsers: userCount,
    activeUsers: activeUsers,
    totalOrgs: orgCount,
    activeOrgs: orgCount, // TODO: 실제 활성 조직 수 계산
    totalRevenue: 0, // TODO: 실제 수익 데이터 계산
    monthlyRevenue: 0, // TODO: 실제 월 수익 데이터 계산
    totalSessions: 0, // TODO: 실제 세션 수 계산
    activeSessions: 0 // TODO: 실제 활성 세션 수 계산
  }

  const quickStats = {
    newUsersToday: 0, // TODO: 오늘 신규 사용자 수 계산
    newOrgsToday: 0, // TODO: 오늘 신규 조직 수 계산
    revenueToday: 0, // TODO: 오늘 수익 계산
    activeSessions: 0 // TODO: 현재 활성 세션 수 계산
  }

  const systemHealth = {
    database: 'healthy' as const,
    redis: 'healthy' as const,
    stripe: 'healthy' as const,
    email: 'healthy' as const,
    storage: 'healthy' as const
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground">
          Diagrammer SaaS 플랫폼 관리
        </p>
      </div>

      {/* 주요 통계 */}
      <AdminStats stats={stats} />

      {/* 오늘의 통계 */}
      <QuickStats stats={quickStats} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">새 사용자 가입</p>
                  <p className="text-xs text-muted-foreground">5분 전</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pro 플랜 구독</p>
                  <p className="text-xs text-muted-foreground">12분 전</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">새 조직 생성</p>
                  <p className="text-xs text-muted-foreground">1시간 전</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 시스템 상태 */}
        <SystemHealth
          health={systemHealth}
          uptime={86400 * 30} // 30일
          version="1.0.0"
        />
      </div>

      {/* 플랜별 사용자 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>플랜별 사용자 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userCount - billingCount}
              </div>
              <div className="text-sm text-muted-foreground">Free 플랜</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {billingCount}
              </div>
              <div className="text-sm text-muted-foreground">유료 플랜</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {orgCount}
              </div>
              <div className="text-sm text-muted-foreground">조직</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
