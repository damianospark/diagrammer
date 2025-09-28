"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { getEntitlements } from "@/lib/entitlements"

const plans = [
  {
    name: "Free",
    price: "₩0",
    period: "영구 무료",
    description: "개인 사용자를 위한 기본 기능",
    features: getEntitlements("free"),
    popular: false
  },
  {
    name: "Pro",
    price: "₩15,000",
    period: "월",
    description: "개인 전문가를 위한 고급 기능",
    features: getEntitlements("pro"),
    popular: true
  },
  {
    name: "Team",
    price: "₩49,000",
    period: "월 (5석 포함)",
    description: "팀 협업을 위한 모든 기능",
    features: getEntitlements("team"),
    popular: false
  }
]

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSubscribe = async (plan: string) => {
    setIsLoading(plan)
    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan === "pro"
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY
        }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Subscription failed:", error)
    } finally {
      setIsLoading(null)
    }
  }

  const renderFeature = (key: string, value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <div className="flex items-center">
          <Check className="h-4 w-4 text-green-500 mr-2" />
          <span className="text-sm">포함</span>
        </div>
      ) : (
        <div className="flex items-center">
          <X className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-muted-foreground">미포함</span>
        </div>
      )
    }

    if (key === "exports") {
      return (
        <div className="text-sm">
          {Array.isArray(value) ? value.join(", ").toUpperCase() : value}
        </div>
      )
    }

    if (key === "sessions" && value === "unlimited") {
      return <span className="text-sm font-medium">무제한</span>
    }

    if (key === "revision" && value === "unlimited") {
      return <span className="text-sm font-medium">무제한</span>
    }

    if (key === "revision" && value === "none") {
      return <span className="text-sm text-muted-foreground">미포함</span>
    }

    return <span className="text-sm">{value}</span>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 mt-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">요금제 선택</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            팀 규모와 필요에 맞는 플랜을 선택하세요. 언제든지 업그레이드하거나 다운그레이드할 수 있습니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
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
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">좌석</span>
                    {renderFeature("seats", plan.features.seats)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">세션 수</span>
                    {renderFeature("sessions", plan.features.sessions)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">일일 메시지</span>
                    {renderFeature("messagesPerDay", plan.features.messagesPerDay)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">최대 노드</span>
                    {renderFeature("maxNodes", plan.features.maxNodes)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">내보내기</span>
                    {renderFeature("exports", plan.features.exports)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">퍼블릭 공유</span>
                    {renderFeature("publicShare", plan.features.publicShare)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">버전 기록</span>
                    {renderFeature("revision", plan.features.revision)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">팀 협업</span>
                    {renderFeature("collab", plan.features.collab)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">API 액세스</span>
                    {renderFeature("api", plan.features.api)}
                  </div>
                </div>

                <Button
                  className="w-full mt-6"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.name.toLowerCase())}
                  disabled={isLoading === plan.name.toLowerCase() || plan.name === "Free"}
                >
                  {isLoading === plan.name.toLowerCase()
                    ? "처리 중..."
                    : plan.name === "Free"
                      ? "현재 플랜"
                      : `${plan.name} 시작하기`
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            모든 플랜에는 14일 무료 체험 기간이 포함됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
