import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 사용자가 속한 조직들 조회
    const orgMembers = await prisma.orgMember.findMany({
      where: { userId: session.user.id },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    const organizations = orgMembers.map(member => ({
      ...member.org,
      role: member.role,
      joinedAt: member.joinedAt
    }))

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error("Organizations fetch failed:", error)
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

    const { name, slug } = await req.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }

    // 조직 생성
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        status: "ACTIVE"
      }
    })

    // 사용자를 조직의 소유자로 추가
    await prisma.orgMember.create({
      data: {
        orgId: organization.id,
        userId: session.user.id,
        role: "OWNER"
      }
    })

    return NextResponse.json({ organization })
  } catch (error) {
    console.error("Organization creation failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
