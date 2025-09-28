import { NextResponse } from "next/server"
import { TestMode } from '@/lib/test-mode'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const TEST_MODE_SESSION_COOKIE = 'next-auth.session-token' // Auth.js 세션 쿠키 이름

/**
 * 테스트 모드 로그아웃 API
 */
export async function POST() {
  if (!TestMode.isEnabled()) {
    return NextResponse.json({ message: 'Test mode is not enabled' }, { status: 403 })
  }

  try {
    // 세션 토큰 가져오기
    const sessionToken = cookies().get(TEST_MODE_SESSION_COOKIE)?.value

    if (sessionToken) {
      // 데이터베이스에서 세션 삭제
      await prisma.session.deleteMany({
        where: { sessionToken }
      })
    }

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    })

    // 쿠키 삭제
    response.headers.set('Set-Cookie', 'next-auth.session-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')

    return response
  } catch (error) {
    console.error("Test mode logout failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
