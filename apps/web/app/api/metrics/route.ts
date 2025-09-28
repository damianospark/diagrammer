import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // 기본 메트릭 수집
    const [
      userCount,
      activeUsers,
      billingProfiles,
      organizations
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.billingProfile.count(),
      prisma.organization.count()
    ])

    // 플랜별 사용자 수
    const planStats = await prisma.billingProfile.groupBy({
      by: ["plan"],
      _count: { plan: true }
    })

    const planDistribution = planStats.reduce((acc, stat) => {
      acc[stat.plan] = stat._count.plan
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics: {
        users: {
          total: userCount,
          active: activeUsers,
          inactive: userCount - activeUsers
        },
        billing: {
          total: billingProfiles,
          planDistribution
        },
        organizations: {
          total: organizations
        }
      }
    })
  } catch (error) {
    console.error("Metrics collection failed:", error)
    return NextResponse.json(
      { error: "Failed to collect metrics" },
      { status: 500 }
    )
  }
}