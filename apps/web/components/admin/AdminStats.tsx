"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Building2,
  CreditCard,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon: React.ComponentType<{ className?: string }>
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

function StatCard({ title, value, change, icon: Icon, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center">
          <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
          <div className="ml-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <div className="flex items-center space-x-1">
                  {change.type === 'increase' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {change.value}%
                  </span>
                </div>
              )}
            </div>
            {change && (
              <p className="text-xs text-muted-foreground">
                {change.period} 대비
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface AdminStatsProps {
  stats: {
    totalUsers: number
    activeUsers: number
    totalOrgs: number
    activeOrgs: number
    totalRevenue: number
    monthlyRevenue: number
    totalSessions: number
    activeSessions: number
  }
  changes?: {
    users?: { value: number; type: 'increase' | 'decrease' }
    orgs?: { value: number; type: 'increase' | 'decrease' }
    revenue?: { value: number; type: 'increase' | 'decrease' }
    sessions?: { value: number; type: 'increase' | 'decrease' }
  }
}

export function AdminStats({ stats, changes }: AdminStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="총 사용자"
        value={stats.totalUsers.toLocaleString()}
        change={changes?.users ? {
          value: changes.users.value,
          type: changes.users.type,
          period: "지난 달"
        } : undefined}
        icon={Users}
        color="primary"
      />

      <StatCard
        title="활성 사용자"
        value={stats.activeUsers.toLocaleString()}
        icon={Activity}
        color="success"
      />

      <StatCard
        title="총 조직"
        value={stats.totalOrgs.toLocaleString()}
        change={changes?.orgs ? {
          value: changes.orgs.value,
          type: changes.orgs.type,
          period: "지난 달"
        } : undefined}
        icon={Building2}
        color="secondary"
      />

      <StatCard
        title="월 수익"
        value={`₩${stats.monthlyRevenue.toLocaleString()}`}
        change={changes?.revenue ? {
          value: changes.revenue.value,
          type: changes.revenue.type,
          period: "지난 달"
        } : undefined}
        icon={CreditCard}
        color="success"
      />
    </div>
  )
}

interface QuickStatsProps {
  stats: {
    newUsersToday: number
    newOrgsToday: number
    revenueToday: number
    activeSessions: number
  }
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-blue-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">오늘 신규 사용자</p>
              <p className="text-2xl font-bold">{stats.newUsersToday}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 text-green-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">오늘 신규 조직</p>
              <p className="text-2xl font-bold">{stats.newOrgsToday}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 text-purple-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">오늘 수익</p>
              <p className="text-2xl font-bold">₩{stats.revenueToday.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Activity className="h-4 w-4 text-orange-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">활성 세션</p>
              <p className="text-2xl font-bold">{stats.activeSessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SystemHealthProps {
  health: {
    database: 'healthy' | 'degraded' | 'down'
    redis: 'healthy' | 'degraded' | 'down'
    stripe: 'healthy' | 'degraded' | 'down'
    email: 'healthy' | 'degraded' | 'down'
    storage: 'healthy' | 'degraded' | 'down'
  }
  uptime: number
  version: string
}

export function SystemHealth({ health, uptime, version }: SystemHealthProps) {
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'down':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'degraded':
        return <TrendingDown className="h-4 w-4 text-yellow-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>시스템 상태</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">서비스 상태</h4>
              <div className="space-y-2">
                {Object.entries(health).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{service}</span>
                    <div className="flex items-center space-x-2">
                      {getHealthIcon(status)}
                      <Badge className={getHealthColor(status)}>
                        {status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">시스템 정보</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">업타임</span>
                  <span className="text-sm font-medium">
                    {Math.floor(uptime / 86400)}일 {Math.floor((uptime % 86400) / 3600)}시간
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">버전</span>
                  <span className="text-sm font-medium">{version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">마지막 체크</span>
                  <span className="text-sm font-medium">
                    {new Date().toLocaleTimeString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
