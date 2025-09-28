import { NextRequest, NextResponse } from "next/server"

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Edge Runtime에서는 인증 상태를 쿠키에서 확인
  const sessionToken = req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value
  const isLoggedIn = !!sessionToken

  // Edge Runtime에서는 사용자 역할을 확인할 수 없으므로 기본값 사용
  const userRole = 'USER' // 실제로는 API 라우트에서 확인

  // Public routes (인증 불필요)
  const publicRoutes = [
    '/',
    '/pricing',
    '/login',
    '/test-login',
    '/legal/terms',
    '/legal/privacy',
    '/share',
    '/api/auth',
    '/api/checkout/session',
    '/api/stripe/webhook',
    '/api/test-mode'
  ]

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // API routes protection
  if (pathname.startsWith('/api/')) {
    // Public API routes
    const publicApiRoutes = [
      '/api/auth',
      '/api/checkout/session',
      '/api/stripe/webhook',
      '/api/test-mode'
    ]

    const isPublicApi = publicApiRoutes.some(route =>
      pathname.startsWith(route)
    )

    if (isPublicApi) {
      return NextResponse.next()
    }

    // Protected API routes require authentication
    if (!isLoggedIn) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
  }

  // Protected routes (인증 필요)
  const protectedRoutes = ['/app', '/settings']
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes (관리자 권한 필요)
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Edge Runtime에서는 역할 확인이 어려우므로 기본적으로 허용
    // 실제 권한 확인은 각 페이지에서 처리
  }

  // Rate limiting for sensitive routes (Edge Runtime 호환)
  if (pathname.startsWith('/api/')) {
    // 간단한 레이트 리미팅 (Edge Runtime 호환)
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const key = `rate_limit:${ip}:${pathname}`

    // TODO: 실제 레이트 리미팅 로직 구현 (Redis 등)
    // 현재는 기본 헤더만 설정
  }

  // Add security headers
  const response = NextResponse.next()

  // 보안 헤더 추가 (Edge Runtime 호환)
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // 의심스러운 활동 감지 (간단한 버전)
  const userAgent = req.headers.get('user-agent')
  if (userAgent && (
    userAgent.includes('bot') ||
    userAgent.includes('crawler') ||
    userAgent.includes('spider') ||
    userAgent.length < 10
  )) {
    // 간단한 로깅 (Edge Runtime 호환)
    console.warn('Suspicious activity detected:', {
      pathname,
      userAgent,
      ip: req.headers.get('x-forwarded-for') || 'unknown'
    })
  }

  // CSP for admin routes
  if (pathname.startsWith('/admin')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
