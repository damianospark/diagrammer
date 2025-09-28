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

    // TODO: 실제 API 키 테이블 구현
    const apiKeys = [
      {
        id: "1",
        name: "프로덕션 API 키",
        key: "sk_live_...",
        permissions: ["read", "write"],
        lastUsed: new Date("2024-09-28T16:45:00Z"),
        status: "active"
      }
    ]

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error("API keys fetch failed:", error)
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

    const { name, permissions, expiresAt } = await req.json()

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Name and permissions are required" },
        { status: 400 }
      )
    }

    // API 키 생성
    const keyPrefix = "sk_live_"
    const keySuffix = randomBytes(32).toString("hex")
    const apiKey = `${keyPrefix}${keySuffix}`

    // TODO: 실제 API 키 테이블에 저장
    const newApiKey = {
      id: Date.now().toString(),
      name,
      key: apiKey,
      permissions,
      lastUsed: null,
      status: "active",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date()
    }

    // 감사 로그 기록
    await createAuditLog({
      action: "api.key_created",
      resource: "api_key",
      resourceId: newApiKey.id,
      userId: session.user.id,
      metadata: { name, permissions }
    })

    return NextResponse.json({ apiKey: newApiKey })
  } catch (error) {
    console.error("API key creation failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
