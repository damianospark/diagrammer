import { auth } from "@/lib/auth"
import { createCheckoutSession } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { priceId } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: "Price ID required" }, { status: 400 })
    }

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_PRIMARY_DOMAIN}/settings?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_PRIMARY_DOMAIN}/pricing?canceled=true`
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout session creation failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
