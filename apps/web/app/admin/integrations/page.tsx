import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Plus,
  Settings,
  Key,
  Webhook,
  Slack,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

export default function AdminIntegrations() {
  const integrations = [
    {
      id: '1',
      type: 'sso',
      name: 'SAML SSO',
      description: '엔터프라이즈 SSO 인증',
      status: 'active',
      lastSync: new Date('2024-09-27T10:30:00Z'),
      config: {
        provider: 'Azure AD',
        users: 150
      }
    },
    {
      id: '2',
      type: 'webhook',
      name: '사용자 이벤트 웹훅',
      description: '사용자 생성/업데이트 이벤트 전송',
      status: 'active',
      lastSync: new Date('2024-09-28T14:20:00Z'),
      config: {
        url: 'https://api.company.com/webhooks/users',
        events: ['user.created', 'user.updated']
      }
    },
    {
      id: '3',
      type: 'slack',
      name: 'Slack 알림',
      description: '관리자 알림을 Slack으로 전송',
      status: 'inactive',
      lastSync: null,
      config: {
        channel: '#admin-alerts',
        events: ['user.suspended', 'billing.failed']
      }
    }
  ]

  const apiKeys = [
    {
      id: '1',
      name: '프로덕션 API 키',
      key: 'sk_live_...',
      permissions: ['read', 'write'],
      lastUsed: new Date('2024-09-28T16:45:00Z'),
      status: 'active'
    },
    {
      id: '2',
      name: '개발용 API 키',
      key: 'sk_test_...',
      permissions: ['read'],
      lastUsed: new Date('2024-09-25T09:15:00Z'),
      status: 'active'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sso':
        return <Shield className="h-5 w-5" />
      case 'webhook':
        return <Webhook className="h-5 w-5" />
      case 'slack':
        return <Slack className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">통합 관리</h1>
          <p className="text-muted-foreground">
            SSO, 웹훅, API 키 등 외부 시스템과의 통합을 관리합니다.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 통합 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">SSO 통합</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.type === 'sso').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Webhook className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">웹훅</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.type === 'webhook').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">API 키</p>
                <p className="text-2xl font-bold">{apiKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium">활성 통합</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 통합 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>통합 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {getTypeIcon(integration.type)}
                  </div>
                  <div>
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {integration.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {integration.lastSync
                        ? `마지막 동기화: ${integration.lastSync.toLocaleString('ko-KR')}`
                        : '동기화 기록 없음'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {integration.config.provider || integration.config.url || integration.config.channel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {integration.type === 'sso' && `${integration.config.users}명 사용자`}
                      {integration.type === 'webhook' && `${integration.config.events?.length || 0}개 이벤트`}
                      {integration.type === 'slack' && `${integration.config.events?.length || 0}개 알림`}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(integration.status)}
                    <Badge className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                  </div>

                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API 키 관리 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>API 키 관리</CardTitle>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              새 API 키
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {key.key}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      마지막 사용: {key.lastUsed.toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {key.permissions.join(', ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      권한
                    </div>
                  </div>

                  <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                    {key.status}
                  </Badge>

                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 통합 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>통합 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">SSO 설정</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">SAML SSO 활성화</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">자동 사용자 프로비저닝</span>
                  <input type="checkbox" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">강제 SSO 로그인</span>
                  <input type="checkbox" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">웹훅 설정</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">웹훅 재시도 활성화</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">최대 재시도 횟수</span>
                  <input type="number" defaultValue="3" className="w-20 px-2 py-1 border rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">재시도 간격 (초)</span>
                  <input type="number" defaultValue="60" className="w-20 px-2 py-1 border rounded" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">API 설정</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API 레이트 리미팅</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">기본 요청 한도 (시간당)</span>
                  <input type="number" defaultValue="1000" className="w-20 px-2 py-1 border rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API 키 만료 알림 (일)</span>
                  <input type="number" defaultValue="30" className="w-20 px-2 py-1 border rounded" />
                </div>
              </div>
            </div>

            <Button>설정 저장</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
