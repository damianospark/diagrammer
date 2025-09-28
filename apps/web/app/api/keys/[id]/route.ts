import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createAuditLog } from "@/lib/audit"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, permissions, status } = await req.json()
    const { id: keyId } = await params

    // TODO: 실제 API 키 테이블 업데이트
    const updatedApiKey = {
      id: keyId,
      name: name || "API 키",
      permissions: permissions || ["read"],
      status: status || "active",
      updatedAt: new Date()
    }

    // 감사 로그 기록
    await createAuditLog({
      action: "api.key_updated",
      resource: "api_key",
      resourceId: keyId,
      userId: session.user.id,
      metadata: { name, permissions, status }
    })

    return NextResponse.json({ apiKey: updatedApiKey })
  } catch (error) {
    console.error("API key update failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: keyId } = await params

    // TODO: 실제 API 키 테이블에서 삭제
    // await prisma.apiKey.delete({ where: { id: keyId } })

    // 감사 로그 기록
    await createAuditLog({
      action: "api.key_deleted",
      resource: "api_key",
      resourceId: keyId,
      userId: session.user.id
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API key deletion failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
