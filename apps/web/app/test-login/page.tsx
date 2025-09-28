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

export default function TestLoginPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { login, isLoading, mounted } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchTestUsers = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
        } else {
          console.error('Failed to fetch test users:', await response.text())
        }
      } catch (error) {
        console.error('Error fetching test users:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTestUsers()
  }, [])

  const handleLogin = async (email: string) => {
    try {
      await login(email)
      router.push('/app') // 로그인 성공 후 대시보드로 리디렉션
    } catch (error) {
      console.error('Error during test login:', error)
      alert('Test login failed: ' + (error as Error).message)
    }
  }

  // Hydration 오류 방지: 클라이언트 마운트 전에는 로딩 상태 유지
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>테스트 사용자 로딩 중...</p>
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