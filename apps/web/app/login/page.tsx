"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Chrome, Facebook, TestTube } from "lucide-react"

export default function LoginPage() {
  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background mt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <p className="text-muted-foreground">
            소셜 계정으로 로그인하세요
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleOAuthSignIn("google")}
            className="w-full"
            variant="outline"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google로 계속하기
          </Button>

          <Button
            onClick={() => handleOAuthSignIn("github")}
            className="w-full"
            variant="outline"
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub로 계속하기
          </Button>

          <Button
            onClick={() => handleOAuthSignIn("facebook")}
            className="w-full"
            variant="outline"
          >
            <Facebook className="mr-2 h-4 w-4" />
            Facebook으로 계속하기
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            로그인하면{" "}
            <a href="/legal/terms" className="underline">
              이용약관
            </a>{" "}
            및{" "}
            <a href="/legal/privacy" className="underline">
              개인정보처리방침
            </a>
            에 동의하는 것으로 간주됩니다.
          </div>

          {/* 테스트 모드 버튼 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 border border-dashed border-muted-foreground/30 rounded-lg">
              <p className="text-sm text-muted-foreground text-center mb-3">
                개발 환경에서만 표시됩니다
              </p>
              <Button
                asChild
                variant="secondary"
                className="w-full"
              >
                <a href="/test-login">
                  <TestTube className="mr-2 h-4 w-4" />
                  테스트 모드로 로그인
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
