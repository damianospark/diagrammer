import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"

export default async function AdminBilling() {
  const billingProfiles = await prisma.billingProfile.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const planStats = await prisma.billingProfile.groupBy({
    by: ['plan'],
    _count: {
      plan: true
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">결제 관리</h1>
        <p className="text-muted-foreground">
          구독 및 결제 상태를 관리합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {planStats.map((stat) => (
          <Card key={stat.plan}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.plan} 플랜
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat._count.plan}</div>
              <p className="text-xs text-muted-foreground">
                활성 구독자
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>구독 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {profile.user.name || '이름 없음'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {profile.user.email || profile.email || '이메일 없음'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Stripe ID: {profile.stripeCustomerId || '없음'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {profile.plan}
                  </Badge>
                  <Badge
                    variant={
                      profile.status === 'ACTIVE' ? 'default' :
                        profile.status === 'CANCELED' ? 'destructive' : 'secondary'
                    }
                  >
                    {profile.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
