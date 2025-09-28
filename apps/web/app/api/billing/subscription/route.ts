import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!billingProfile) {
      return NextResponse.json({
        subscription: null,
        message: "No subscription found"
      })
    }

    return NextResponse.json({
      subscription: {
        id: billingProfile.id,
        plan: billingProfile.plan,
        status: billingProfile.status,
        currentPeriodStart: billingProfile.createdAt,
        currentPeriodEnd: billingProfile.renewedAt,
        renewedAt: billingProfile.renewedAt,
        stripeCustomerId: billingProfile.stripeCustomerId
      }
    })
  } catch (error) {
    console.error("Subscription fetch failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
