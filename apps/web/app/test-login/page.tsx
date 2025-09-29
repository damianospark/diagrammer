"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, PauseCircle, Shield, User, Crown, Zap, AlertCircle } from 'lucide-react'
import { useAuth, type User } from '@/lib/fastapi-auth'

// 하드코딩된 테스트 사용자 (fallback용)
const FALLBACK_TEST_USERS: User[] = [
  {
    id: "test-user-001",
    email: "user@test.com",
    name: "테스트 사용자",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
    role: "USER",
    plan: "free",
    status: "ACTIVE"
  },
  {
    id: "test-user-002",
    email: "pro@test.com",
    name: "Pro 사용자",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=pro",
    role: "USER",
    plan: "pro",
    status: "ACTIVE"
  },
  {
    id: "test-admin-001",
    email: "admin@test.com",
    name: "관리자",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    role: "ADMIN",
    plan: "pro",
    status: "ACTIVE"
  },
  {
    id: "test-owner-001",
    email: "owner@test.com",
    name: "소유자",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=owner",
    role: "OWNER",
    plan: "team",
    status: "ACTIVE"
  }
]

export default function TestLoginPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('TestLoginPage: Component mounted')
    setMounted(true)

    const fetchTestUsers = async () => {
      try {
        console.log('TestLoginPage: Fetching test users...')
        const response = await fetch('http://localhost:8000/api/auth/users')
        console.log('TestLoginPage: Response status:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('TestLoginPage: Test users data:', data)
          setUsers(data.users)
        } else {
          const errorText = await response.text()
          console.error('TestLoginPage: Failed to fetch test users:', response.status, errorText)
          // 에러가 발생하면 fallback 사용자 사용
          console.log('TestLoginPage: Using fallback test users')
          setUsers(FALLBACK_TEST_USERS)
        }
      } catch (error) {
        console.error('TestLoginPage: Error fetching test users:', error)
        // 네트워크 에러가 발생하면 fallback 사용자 사용
        console.log('TestLoginPage: Using fallback test users due to network error')
        setUsers(FALLBACK_TEST_USERS)
      } finally {
        console.log('TestLoginPage: Setting loading to false')
        setLoading(false)
      }
    }

    // 바로 실행
    fetchTestUsers()
  }, [])

  // 사용자가 없으면 fallback 사용자로 초기화
  useEffect(() => {
    if (mounted && users.length === 0 && !loading) {
      console.log('TestLoginPage: No users loaded, using fallback')
      setUsers(FALLBACK_TEST_USERS)
    }
  }, [mounted, users.length, loading])

  const handleLogin = async (email: string) => {
    try {
      console.log('TestLoginPage: Attempting login for:', email)
      const result = await login(email)
      console.log('TestLoginPage: Login successful:', result)

      // 로그인 성공 후 잠시 대기 (쿠키 설정 완료 대기)
      await new Promise(resolve => setTimeout(resolve, 100))

      // 사용자 역할에 따라 리디렉션 결정
      const userRole = result.user.role
      console.log('TestLoginPage: User role:', userRole)

      if (userRole === 'ADMIN' || userRole === 'OWNER') {
        console.log('TestLoginPage: Redirecting to /admin (admin/owner user)')
        // 관리자/소유자는 admin 페이지로 이동 (router.push 사용)
        router.push('/admin')
      } else {
        console.log('TestLoginPage: Redirecting to /app (regular user)')
        router.push('/app')
      }
    } catch (error) {
      console.error('TestLoginPage: Error during test login:', error)
      alert('Test login failed: ' + (error as Error).message)
    }
  }

  // 간단한 로딩 처리
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 mt-16">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">테스트 모드 로그인</CardTitle>
            <p className="text-muted-foreground">
              테스트 사용자를 불러오는 중...
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-2 bg-gray-200 rounded w-48 mx-auto"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 사용자가 없으면 fallback 사용자 표시
  if (users.length === 0) {
    console.log('TestLoginPage: No users loaded, using fallback')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 mt-16">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">테스트 모드 로그인</CardTitle>
            <p className="text-muted-foreground">
              백엔드 연결 실패. 기본 테스트 사용자를 사용합니다.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {FALLBACK_TEST_USERS.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.role} • {user.plan}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleLogin(user.email)}
                    disabled={isLoading}
                    className="ml-4"
                  >
                    {isLoading ? "로그인 중..." : "로그인"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  const activeUsers = users.filter(user => user.status === 'ACTIVE')
  const inactiveUsers = users.filter(user => user.status !== 'ACTIVE')

  const getStatusIcon = (status: User['status']) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'INACTIVE': return <XCircle className="h-4 w-4 text-red-500" />
      case 'SUSPENDED': return <PauseCircle className="h-4 w-4 text-yellow-500" />
      default: return null
    }
  }

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'USER': return <User className="h-4 w-4 text-gray-500" />
      case 'ADMIN': return <Shield className="h-4 w-4 text-blue-500" />
      case 'OWNER': return <Crown className="h-4 w-4 text-yellow-500" />
      default: return null
    }
  }

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'USER': return <Badge variant="secondary">사용자</Badge>
      case 'ADMIN': return <Badge className="bg-blue-500 hover:bg-blue-500/80 text-primary-foreground">관리자</Badge>
      case 'OWNER': return <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-primary-foreground">소유자</Badge>
      default: return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getPlanBadge = (plan: User['plan']) => {
    switch (plan) {
      case 'free': return <Badge variant="secondary">Free</Badge>
      case 'pro': return <Badge className="bg-green-500 hover:bg-green-500/80 text-primary-foreground">Pro</Badge>
      case 'team': return <Badge className="bg-purple-500 hover:bg-purple-500/80 text-primary-foreground">Team</Badge>
      default: return <Badge variant="secondary">{plan}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 mt-16">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">테스트 모드 로그인</CardTitle>
          <p className="text-muted-foreground">
            OAuth 없이 미리 정의된 테스트 사용자로 로그인할 수 있습니다.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                {activeUsers.length > 0 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                활성 사용자 ({activeUsers.length})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                {inactiveUsers.length > 0 ? <AlertCircle className="h-4 w-4 text-yellow-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                비활성 사용자 ({inactiveUsers.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4 space-y-4">
              {activeUsers.length === 0 ? (
                <p className="text-center text-muted-foreground">활성 테스트 사용자가 없습니다.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold tracking-tight text-lg">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <span className="text-sm">역할</span>
                          </div>
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">플랜</span>
                          </div>
                          {getPlanBadge(user.plan)}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(user.status)}
                            <span className="text-sm">상태</span>
                          </div>
                          <span className="text-sm text-muted-foreground capitalize">{user.status.toLowerCase()}</span>
                        </div>
                        <Button
                          onClick={() => handleLogin(user.email)}
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? '로그인 중...' : '로그인'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="inactive" className="mt-4 space-y-4">
              {inactiveUsers.length === 0 ? (
                <p className="text-center text-muted-foreground">비활성/정지 테스트 사용자가 없습니다.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactiveUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow opacity-70">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.image} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold tracking-tight text-lg">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <span className="text-sm">역할</span>
                          </div>
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">플랜</span>
                          </div>
                          {getPlanBadge(user.plan)}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(user.status)}
                            <span className="text-sm">상태</span>
                          </div>
                          <span className="text-sm text-muted-foreground capitalize">{user.status.toLowerCase()}</span>
                        </div>
                        <Button
                          className="w-full"
                          variant="outline"
                          disabled
                        >
                          로그인 불가
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <a href="/">홈으로 돌아가기</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
