import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  Zap,
  Shield
} from "lucide-react"
import { getEntitlements } from "@/lib/entitlements"

export default function AdminPlans() {
  const plans = [
    { key: 'free', name: 'Free', price: '₩0', period: '영구 무료' },
    { key: 'pro', name: 'Pro', price: '₩15,000', period: '월' },
    { key: 'team', name: 'Team', price: '₩49,000', period: '월 (5석 포함)' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">플랜 관리</h1>
          <p className="text-muted-foreground">
            요금제와 엔타이틀을 관리합니다.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 플랜 생성
        </Button>
      </div>

      {/* 플랜 목록 */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const entitlements = getEntitlements(plan.key)

          return (
            <Card key={plan.key} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <Badge variant="outline">
                    {plan.price} {plan.period}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 엔타이틀 표시 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>좌석</span>
                    <span className="font-medium">{entitlements.seats}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>세션 수</span>
                    <span className="font-medium">
                      {entitlements.sessions === 'unlimited' ? '무제한' : entitlements.sessions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>일일 메시지</span>
                    <span className="font-medium">{entitlements.messagesPerDay.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>최대 노드</span>
                    <span className="font-medium">{entitlements.maxNodes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>내보내기</span>
                    <span className="font-medium">{entitlements.exports.join(', ').toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>퍼블릭 공유</span>
                    <Badge variant={entitlements.publicShare ? 'default' : 'secondary'}>
                      {entitlements.publicShare ? 'O' : 'X'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>팀 협업</span>
                    <Badge variant={entitlements.collab ? 'default' : 'secondary'}>
                      {entitlements.collab ? 'O' : 'X'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>API 액세스</span>
                    <Badge variant={entitlements.api !== 'none' ? 'default' : 'secondary'}>
                      {entitlements.api}
                    </Badge>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-2 h-4 w-4" />
                    편집
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 엔타이틀 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>엔타이틀 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">기본 세션 수</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="2"
                  />
                  <Button variant="outline" size="sm">적용</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">기본 메시지 한도</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="100"
                  />
                  <Button variant="outline" size="sm">적용</Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">기본 노드 한도</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="100"
                  />
                  <Button variant="outline" size="sm">적용</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">기본 내보내기 형식</label>
                <div className="flex gap-2">
                  <select className="flex-1 px-3 py-2 border rounded-md">
                    <option value="png">PNG</option>
                    <option value="pptx">PPTX</option>
                    <option value="slides">Google Slides</option>
                  </select>
                  <Button variant="outline" size="sm">적용</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용량 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>플랜별 사용량 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{plan.name} 플랜</div>
                    <div className="text-sm text-muted-foreground">
                      활성 구독자: 0명
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">월 수익</div>
                    <div className="text-xs text-muted-foreground">₩0</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    사용자 보기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
