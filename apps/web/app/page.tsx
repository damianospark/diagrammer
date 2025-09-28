"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Zap,
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  Play,
  Github,
  Chrome,
  Facebook
} from "lucide-react"
import Link from "next/link"
import { signIn } from "next-auth/react"

export default function LandingPage() {
  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/" })
  }

  const features = [
    {
      icon: Sparkles,
      title: "AI 기반 생성",
      description: "자연어로 복잡한 다이어그램을 몇 초 만에 생성"
    },
    {
      icon: Zap,
      title: "다중 엔진",
      description: "Mermaid, vis.js, Graphviz를 자동 선택해 최적화"
    },
    {
      icon: Shield,
      title: "보안 공유",
      description: "PIN 기반 보안 공유로 안전한 협업"
    },
    {
      icon: Users,
      title: "팀 협업",
      description: "실시간 편집과 버전 관리로 효율적인 팀워크"
    }
  ]

  const plans = [
    {
      name: "Free",
      price: "₩0",
      period: "영구 무료",
      description: "개인 사용자를 위한 기본 기능",
      features: [
        "2개 세션 저장",
        "일일 100개 메시지",
        "최대 100개 노드",
        "PNG 내보내기"
      ],
      cta: "무료로 시작하기",
      popular: false
    },
    {
      name: "Pro",
      price: "₩15,000",
      period: "월",
      description: "개인 전문가를 위한 고급 기능",
      features: [
        "200개 세션 저장",
        "일일 2,000개 메시지",
        "최대 1,000개 노드",
        "PNG, PPTX 내보내기",
        "퍼블릭 공유",
        "버전 기록 (최근 10회)"
      ],
      cta: "Pro 시작하기",
      popular: true
    },
    {
      name: "Team",
      price: "₩49,000",
      period: "월 (5석 포함)",
      description: "팀 협업을 위한 모든 기능",
      features: [
        "무제한 세션",
        "일일 10,000개 메시지",
        "최대 5,000개 노드",
        "PNG, PPTX, Google Slides",
        "팀 협업 (동시 편집)",
        "무제한 버전 기록",
        "API 액세스"
      ],
      cta: "Team 시작하기",
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-background mt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              AI 기반 다이어그램 생성
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              채팅으로 즉시 차트를 생성하세요
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              AI가 이해하는 자연어로 복잡한 다이어그램을 몇 초 만에 만들어보세요.
              Mermaid, vis.js, Graphviz를 자동으로 선택해 최적의 시각화를 제공합니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/test-login">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link href="/test-login">
                  <Play className="mr-2 h-5 w-5" />
                  데모 보기
                </Link>
              </Button>
            </div>

            {/* OAuth Login Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => handleOAuthSignIn("google")}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google로 시작하기
              </Button>
              <Button
                onClick={() => handleOAuthSignIn("github")}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub로 시작하기
              </Button>
              <Button
                onClick={() => handleOAuthSignIn("facebook")}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Facebook으로 시작하기
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              왜 Diagrammer를 선택해야 할까요?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              복잡한 도구 없이도 전문적인 다이어그램을 쉽게 만들 수 있습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              실제로 어떻게 작동하나요?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              간단한 프롬프트로 복잡한 다이어그램을 생성해보세요.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">데모 예시</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">사용자 입력:</p>
                    <p className="font-medium">
                      "고객이 제품을 주문하고 결제하는 플로우차트를 만들어줘"
                    </p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">AI 생성 결과:</p>
                    <div className="bg-white p-4 rounded border">
                      <pre className="text-sm text-muted-foreground">
                        {`graph TD
    A[고객] --> B[제품 선택]
    B --> C[장바구니 추가]
    C --> D[주문 확인]
    D --> E[결제 정보 입력]
    E --> F[결제 처리]
    F --> G[주문 완료]
    G --> H[이메일 확인]`}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              요금제 선택
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              팀 규모와 필요에 맞는 플랜을 선택하세요. 언제든지 업그레이드하거나 다운그레이드할 수 있습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""
                  }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    인기
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-6"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/test-login">
                      {plan.cta}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            지금 바로 시작해보세요
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            14일 무료 체험으로 모든 기능을 경험해보세요. 신용카드 없이 시작할 수 있습니다.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
            <Link href="/test-login">
              무료로 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Diagrammer</h3>
              <p className="text-sm text-muted-foreground">
                AI 기반 다이어그램 생성 및 편집 플랫폼
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">제품</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-foreground">요금제</Link></li>
                <li><Link href="/features" className="hover:text-foreground">기능</Link></li>
                <li><Link href="/demo" className="hover:text-foreground">데모</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">지원</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground">도움말</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">문의하기</Link></li>
                <li><Link href="/status" className="hover:text-foreground">서비스 상태</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">법적</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/legal/terms" className="hover:text-foreground">이용약관</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-foreground">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Diagrammer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}