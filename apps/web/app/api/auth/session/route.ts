import { NextRequest, NextResponse } from "next/server"
import { TestMode } from "@/lib/test-mode"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // 테스트 모드에서 세션 확인
    if (TestMode.isEnabled()) {
      const sessionToken = cookies().get('next-auth.session-token')?.value

      if (!sessionToken) {
        return NextResponse.json({ user: null })
      }

      // 데이터베이스에서 세션 확인
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: true
        }
      })

      if (!session || session.expires < new Date()) {
        return NextResponse.json({ user: null })
      }

      // 테스트 사용자 정보 가져오기
      const testUser = TestMode.getUserByEmail(session.user.email || '')

      if (testUser) {
        return NextResponse.json({
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
            role: testUser.role,
            status: testUser.status === 'INACTIVE' ? 'SUSPENDED' : testUser.status
          }
        })
      }
    }

    return NextResponse.json({ user: null })
  } catch (error) {
    console.error("Session API error:", error)
    return NextResponse.json({ user: null })
  }
}
