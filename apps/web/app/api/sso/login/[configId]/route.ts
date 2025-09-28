import { NextRequest, NextResponse } from "next/server"
import { initiateSSOLogin } from "@/lib/sso"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params
    const returnUrl = req.nextUrl.searchParams.get('return_url') || '/'

    const { redirectUrl, state } = await initiateSSOLogin(configId, returnUrl)

    // 상태를 세션에 저장 (실제로는 Redis나 DB에 저장)
    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set('sso_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10분
    })
    response.cookies.set('sso_return_url', returnUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10분
    })

    return response
  } catch (error) {
    console.error("SSO login initiation failed:", error)
    return NextResponse.redirect('/login?error=sso_failed')
  }
}
