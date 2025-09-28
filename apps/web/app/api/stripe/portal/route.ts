import { createPortalSession } from "@/lib/stripe"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // FastAPI에서 사용자 정보 조회
    const response = await fetch('http://localhost:8000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await response.json()

    // TODO: FastAPI에서 사용자의 Stripe Customer ID 조회
    // 현재는 테스트용으로 임시 처리
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing profile found" },
        { status: 404 }
      )
    }

    const portalSession = await createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${process.env.NEXT_PUBLIC_PRIMARY_DOMAIN}/settings`
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Portal session creation failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
