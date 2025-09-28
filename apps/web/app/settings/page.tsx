"use client"

export const dynamic = "force-dynamic"



import { useState } from "react"
import { useAuth } from "@/lib/fastapi-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Shield,
  CreditCard,
  Settings as SettingsIcon,
  Save,
  ExternalLink,
  Trash2,
  Key
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user, isLoading, isAuthenticated, mounted, fetchWithAuth } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")

  // Hydration 오류 방지: 클라이언트 마운트 전에는 로딩 상태 유지
  if (!mounted || isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>로그인이 필요합니다.</div>
      </div>
    )
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetchWithAuth("/api/user", {
        method: "PUT",
        body: JSON.stringify({ name, email })
      })

      if (response.ok) {
        toast({
          title: "프로필이 업데이트되었습니다.",
          description: "변경사항이 저장되었습니다."
        })
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다.",
        description: "프로필 업데이트에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreatePortalSession = async () => {
    setIsSaving(true)
    try {
      const response = await fetchWithAuth("/api/stripe/portal", {
        method: "POST",
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        throw new Error("Portal session creation failed")
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다.",
        description: "결제 포털에 접근할 수 없습니다.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return
    }

    setIsLoading(true)
    try {
      // TODO: 계정 삭제 API 호출
      toast({
        title: "계정이 삭제되었습니다.",
        description: "이용해주셔서 감사합니다."
      })
    } catch (error) {
      toast({
        title: "오류가 발생했습니다.",
        description: "계정 삭제에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">설정</h1>
            <p className="text-muted-foreground">
              계정 설정을 관리하고 개인정보를 업데이트하세요.
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                프로필
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                보안
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                청구
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                환경설정
              </TabsTrigger>
            </TabsList>

            {/* 프로필 탭 */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>프로필 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback className="text-lg">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">
                        사진 변경
                      </Button>
                      <p className="text-sm text-muted-foreground mt-1">
                        JPG, PNG 또는 GIF (최대 2MB)
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">이름</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력하세요"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일을 입력하세요"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        이메일은 OAuth 제공자에서 관리됩니다.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>역할</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {user.role || 'USER'}
                      </Badge>
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "저장 중..." : "변경사항 저장"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 보안 탭 */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>보안 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">OAuth 계정</h4>
                        <p className="text-sm text-muted-foreground">
                          연결된 소셜 계정을 관리하세요.
                        </p>
                      </div>
                      <Badge variant="outline">Google</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Passkey</h4>
                        <p className="text-sm text-muted-foreground">
                          생체인증으로 더 안전하게 로그인하세요.
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Key className="mr-2 h-4 w-4" />
                        Passkey 설정
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">세션 관리</h4>
                        <p className="text-sm text-muted-foreground">
                          모든 기기에서 로그아웃합니다.
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        모든 세션 종료
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">위험 구역</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">계정 삭제</h4>
                      <p className="text-sm text-muted-foreground">
                        계정과 모든 데이터를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      계정 삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 청구 탭 */}
            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>구독 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">현재 플랜</h4>
                      <p className="text-sm text-muted-foreground">
                        Free 플랜을 사용 중입니다.
                      </p>
                    </div>
                    <Badge variant="outline">Free</Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">사용량</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>세션 수</span>
                          <span>0 / 2</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>일일 메시지</span>
                          <span>0 / 100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button asChild>
                      <a href="/pricing">
                        플랜 업그레이드
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCreatePortalSession}
                      disabled={isSaving}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      결제 관리
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>결제 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    아직 결제 내역이 없습니다.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 환경설정 탭 */}
            <TabsContent value="preferences" className="space-y-6">
      <Card>
        <CardHeader>
                  <CardTitle>환경설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">언어</h4>
                      <p className="text-sm text-muted-foreground">
                        인터페이스 언어를 선택하세요.
                      </p>
                      <div className="mt-2">
                        <Button variant="outline" size="sm">
                          한국어
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium">테마</h4>
                      <p className="text-sm text-muted-foreground">
                        인터페이스 테마를 선택하세요.
                      </p>
                      <div className="mt-2 space-x-2">
                        <Button variant="outline" size="sm">
                          라이트
                        </Button>
                        <Button variant="outline" size="sm">
                          다크
                        </Button>
                        <Button variant="outline" size="sm">
                          시스템
                        </Button>
                      </div>
                    </div>

          <div>
                      <h4 className="font-medium">알림</h4>
                      <p className="text-sm text-muted-foreground">
                        이메일 알림 설정을 관리하세요.
                      </p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="email-notifications" defaultChecked />
                          <label htmlFor="email-notifications" className="text-sm">
                            이메일 알림 받기
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="marketing-emails" />
                          <label htmlFor="marketing-emails" className="text-sm">
                            마케팅 이메일 받기
            </label>
                        </div>
                      </div>
            </div>
          </div>
        </CardContent>
      </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}