import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Activity,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Building2,
  CreditCard,
  Shield
} from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function AdminAudit() {
  const auditLogs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      org: {
        select: {
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  })

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="h-4 w-4" />
    if (action.includes('org')) return <Building2 className="h-4 w-4" />
    if (action.includes('billing')) return <CreditCard className="h-4 w-4" />
    if (action.includes('admin')) return <Shield className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'bg-green-100 text-green-800'
    if (action.includes('updated')) return 'bg-blue-100 text-blue-800'
    if (action.includes('deleted')) return 'bg-red-100 text-red-800'
    if (action.includes('failed')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">감사 로그</h1>
          <p className="text-muted-foreground">
            시스템 내 모든 중요한 활동을 모니터링합니다.
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          로그 내보내기
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="액션, 리소스, 사용자 검색..."
                className="pl-10"
              />
            </div>
            <select className="px-3 py-2 border rounded-md">
              <option value="">모든 액션</option>
              <option value="user">사용자 관련</option>
              <option value="billing">결제 관련</option>
              <option value="org">조직 관련</option>
              <option value="admin">관리자 관련</option>
            </select>
            <select className="px-3 py-2 border rounded-md">
              <option value="">모든 리소스</option>
              <option value="user">사용자</option>
              <option value="organization">조직</option>
              <option value="billing">결제</option>
              <option value="system">시스템</option>
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              필터 적용
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">총 로그</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">활성 사용자</p>
                <p className="text-2xl font-bold">
                  {new Set(auditLogs.map(log => log.userId).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">활성 조직</p>
                <p className="text-2xl font-bold">
                  {new Set(auditLogs.map(log => log.orgId).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">오늘 활동</p>
                <p className="text-2xl font-bold">
                  {auditLogs.filter(log =>
                    new Date(log.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 감사 로그 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    {getActionIcon(log.action)}
                  </div>
                  <div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.resource} {log.resourceId && `(${log.resourceId})`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge className={getActionColor(log.action)}>
                    {log.action.split('.')[0]}
                  </Badge>

                  {log.user && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {log.user.name || '이름 없음'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.user.email}
                      </div>
                    </div>
                  )}

                  {log.org && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {log.org.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.org.slug}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
