import { NextRequest, NextResponse } from "next/server"
import { TestMode, TEST_USERS, createTestSession, setTestModeCookie } from "@/lib/test-mode"
import { prisma } from "@/lib/prisma"

/**
 * 테스트 모드 로그인 API
 * OAuth 없이 미리 정의된 테스트 사용자로 로그인
 */
export async function POST(req: NextRequest) {
  // 테스트 모드가 활성화되어 있는지 확인
  if (!TestMode.isEnabled()) {
    return NextResponse.json(
      { error: "Test mode is not enabled" },
      { status: 403 }
    )
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // 테스트 사용자 찾기
    const testUser = TestMode.getUserByEmail(email)
    if (!testUser) {
      return NextResponse.json(
        { error: "Test user not found" },
        { status: 404 }
      )
    }

    // 비활성 또는 정지된 사용자 확인
    if (testUser.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error: "User account is not active",
          status: testUser.status
        },
        { status: 403 }
      )
    }

    // 테스트 사용자를 데이터베이스에 생성/업데이트
    const dbUser = await prisma.user.upsert({
      where: { email: testUser.email },
      update: {
        name: testUser.name,
        image: testUser.image,
        role: testUser.role,
        status: testUser.status === 'INACTIVE' ? 'SUSPENDED' : testUser.status
      },
      create: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        image: testUser.image,
        role: testUser.role,
        status: testUser.status === 'INACTIVE' ? 'SUSPENDED' : testUser.status
      }
    })

    // Auth.js 세션 생성
    const session = await prisma.session.create({
      data: {
        sessionToken: `test-session-${testUser.id}-${Date.now()}`,
        userId: dbUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일
      }
    })

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      user: testUser,
      message: `Logged in as ${testUser.name} (${testUser.role})`
    })

    // Auth.js 세션 쿠키 설정
    const cookie = `next-auth.session-token=${session.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    response.headers.set('Set-Cookie', cookie)

    return response
  } catch (error) {
    console.error("Test mode login failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * 테스트 모드 사용자 목록 조회
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
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const plan = searchParams.get('plan')
    const status = searchParams.get('status')

    let users = TestMode.getUsers()

    // 필터링
    if (role) {
      users = users.filter(user => user.role === role)
    }
    if (plan) {
      users = users.filter(user => user.plan === plan)
    }
    if (status) {
      users = users.filter(user => user.status === status)
    }

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
      filters: { role, plan, status }
    })
  } catch (error) {
    console.error("Test mode users fetch failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
