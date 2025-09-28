import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createAuditLog } from "@/lib/audit"
import { randomBytes } from "crypto"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // TODO: 실제 웹훅 테이블 구현
    const webhooks = [
      {
        id: "1",
        name: "사용자 이벤트 웹훅",
        url: "https://api.company.com/webhooks/users",
        events: ["user.created", "user.updated"],
        status: "active",
        lastDelivery: new Date("2024-09-28T14:20:00Z"),
        failureCount: 0
      }
    ]

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error("Webhooks fetch failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, url, events, status = "active" } = await req.json()

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Name, URL, and events are required" },
        { status: 400 }
      )
    }

    // 웹훅 시크릿 생성
    const secret = randomBytes(32).toString("hex")

    // TODO: 실제 웹훅 테이블에 저장
    const newWebhook = {
      id: Date.now().toString(),
      name,
      url,
      events,
      secret,
      status,
      lastDelivery: null,
      failureCount: 0,
      createdAt: new Date()
    }

    // 감사 로그 기록
    await createAuditLog({
      action: "webhook.created",
      resource: "webhook",
      resourceId: newWebhook.id,
      userId: session.user.id,
      metadata: { name, url, events }
    })

    return NextResponse.json({ webhook: newWebhook })
  } catch (error) {
    console.error("Webhook creation failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
