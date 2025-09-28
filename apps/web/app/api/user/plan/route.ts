import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { getEntitlements } from "@/lib/entitlements"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 사용자의 결제 프로필 조회
    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: session.user.id }
    })

    const plan = billingProfile?.plan || "free"
    const entitlements = getEntitlements(plan)

    return NextResponse.json({
      plan,
      entitlements,
      billingProfile: billingProfile ? {
        plan: billingProfile.plan,
        status: billingProfile.status,
        currentPeriodEnd: billingProfile.renewedAt,
        renewedAt: billingProfile.renewedAt
      } : null
    })
  } catch (error) {
    console.error("User plan fetch failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
