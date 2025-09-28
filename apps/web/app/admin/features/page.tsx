import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Flag,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Settings,
  BarChart3,
  Users,
  Calendar
} from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function AdminFeatures() {
  const featureFlags = await prisma.featureFlag.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">기능 플래그</h1>
          <p className="text-muted-foreground">
            점진적 기능 출시와 A/B 테스트를 관리합니다.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 플래그 생성
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="플래그 키 또는 이름으로 검색..."
                  className="pl-10"
                />
              </div>
            </div>
            <select className="px-3 py-2 border rounded-md">
              <option value="">모든 상태</option>
              <option value="enabled">활성화됨</option>
              <option value="disabled">비활성화됨</option>
            </select>
            <Button variant="outline">
              필터
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">총 플래그</p>
                <p className="text-2xl font-bold">{featureFlags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <ToggleRight className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium">활성화됨</p>
                <p className="text-2xl font-bold">
                  {featureFlags.filter(flag => flag.enabled).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <ToggleLeft className="h-4 w-4 text-gray-400" />
              <div className="ml-2">
                <p className="text-sm font-medium">비활성화됨</p>
                <p className="text-2xl font-bold">
                  {featureFlags.filter(flag => !flag.enabled).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">평균 롤아웃</p>
                <p className="text-2xl font-bold">
                  {featureFlags.length > 0
                    ? Math.round(featureFlags.reduce((sum, flag) => sum + flag.rollout, 0) / featureFlags.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 기능 플래그 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>기능 플래그 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featureFlags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Flag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{flag.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {flag.key}
                    </div>
                    {flag.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {flag.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      생성일: {new Date(flag.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">롤아웃</div>
                    <div className="text-xs text-muted-foreground">
                      {flag.rollout}%
                    </div>
                  </div>

                  <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                    {flag.enabled ? '활성화' : '비활성화'}
                  </Badge>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 플래그 생성 폼 */}
      <Card>
        <CardHeader>
          <CardTitle>새 기능 플래그 생성</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">플래그 키</label>
                <Input placeholder="new-feature" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">플래그 이름</label>
                <Input placeholder="새 기능" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">설명</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="이 플래그의 목적과 기능을 설명하세요..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">초기 상태</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="false">비활성화</option>
                  <option value="true">활성화</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">롤아웃 비율</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="0"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">0%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button>플래그 생성</Button>
              <Button variant="outline">취소</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
