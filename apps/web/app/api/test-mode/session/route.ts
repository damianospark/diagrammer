import { NextRequest, NextResponse } from "next/server"
import { TestMode, TEST_USERS, type TestUser } from "@/lib/test-mode"

/**
 * 테스트 모드 세션 정보 조회 API
 */
export async function GET(req: NextRequest) {
  // 테스트 모드가 활성화되어 있는지 확인
  if (!TestMode.isEnabled()) {
    return NextResponse.json(
      { error: "Test mode is not enabled" },
      { status: 403 }
    )
  }

  try {
    // 쿠키에서 테스트 토큰 추출
    const sessionToken = req.cookies.get('next-auth.session-token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: "No session token found" },
        { status: 401 }
      )
    }

    // 간단한 토큰 디코딩 (실제 프로덕션에서는 JWT 라이브러리 사용)
    try {
      const payload = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
      const testUser = TestMode.getUserByEmail(payload.email)

      if (!testUser) {
        return NextResponse.json(
          { error: "Test user not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        user: testUser,
        session: {
          user: {
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
            image: testUser.image
          },
          expires: new Date(payload.exp * 1000).toISOString()
        }
      })
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid session token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Test mode session fetch failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
