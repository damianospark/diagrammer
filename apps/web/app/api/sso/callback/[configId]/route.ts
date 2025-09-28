import { NextRequest, NextResponse } from "next/server"
import { handleSSOCallback, provisionSSOUser } from "@/lib/sso"
import { signIn } from "next-auth/react"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params
    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')
    const storedState = req.cookies.get('sso_state')?.value
    const returnUrl = req.cookies.get('sso_return_url')?.value || '/'

    if (!code || !state || !storedState) {
      return NextResponse.redirect('/login?error=invalid_sso_callback')
    }

    if (state !== storedState) {
      return NextResponse.redirect('/login?error=invalid_state')
    }

    // SSO 콜백 처리
    const ssoUser = await handleSSOCallback(configId, code, state)

    // 사용자 프로비저닝
    const { userId, isNew } = await provisionSSOUser(ssoUser, configId)

    // NextAuth 세션 생성
    // TODO: 실제 세션 생성 로직
    // await signIn('credentials', {
    //   userId,
    //   redirect: false
    // })

    // 쿠키 정리
    const response = NextResponse.redirect(returnUrl)
    response.cookies.delete('sso_state')
    response.cookies.delete('sso_return_url')

    return response
  } catch (error) {
    console.error("SSO callback failed:", error)
    return NextResponse.redirect('/login?error=sso_callback_failed')
  }
}
