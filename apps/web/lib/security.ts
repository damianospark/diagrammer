import { NextRequest } from "next/server"

// CSRF 토큰 생성 및 검증 (Edge Runtime 호환)
export function generateCSRFToken(): string {
  // Edge Runtime에서는 crypto.randomBytes 사용 불가
  // 대신 Web Crypto API 사용
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function verifyCSRFToken(token: string, secret: string): boolean {
  // TODO: 실제 CSRF 토큰 검증 로직
  return token.length === 64 // 간단한 검증
}

// XSS 방지를 위한 입력 검증
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .trim()
}

// SQL 인젝션 방지를 위한 입력 검증
export function validateSQLInput(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
    /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/gi,
    /(\b(OR|AND)\s+['"]\s*IN\s*\()/gi,
    /(\b(OR|AND)\s+['"]\s*BETWEEN\s+)/gi,
    /(\b(OR|AND)\s+['"]\s*EXISTS\s*\()/gi,
    /(\b(OR|AND)\s+['"]\s*NOT\s+EXISTS\s*\()/gi
  ]

  return !sqlPatterns.some(pattern => pattern.test(input))
}

// 파일 업로드 보안 검증
export function validateFileUpload(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
): { valid: boolean; error?: string } {
  // 파일 타입 검증
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' }
  }

  // 파일 크기 검증
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' }
  }

  // 파일명 검증
  if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
    return { valid: false, error: 'Invalid file name' }
  }

  return { valid: true }
}

// IP 주소 검증
export function validateIPAddress(ip: string): boolean {
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip)
}

// 이메일 주소 검증
export function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email) && email.length <= 254
}

// 비밀번호 강도 검증
export function validatePasswordStrength(password: string): {
  valid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character')
  } else {
    score += 1
  }

  return {
    valid: score >= 4,
    score,
    feedback
  }
}

// 요청 헤더 검증
export function validateRequestHeaders(req: NextRequest): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // User-Agent 검증
  const userAgent = req.headers.get('user-agent')
  if (!userAgent || userAgent.length > 500) {
    issues.push('Invalid or missing User-Agent header')
  }

  // Referer 검증 (CSRF 방지)
  const referer = req.headers.get('referer')
  if (req.method !== 'GET' && !referer) {
    issues.push('Missing Referer header for non-GET request')
  }

  // Content-Type 검증
  const contentType = req.headers.get('content-type')
  if (req.method === 'POST' && !contentType) {
    issues.push('Missing Content-Type header for POST request')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

// 세션 보안 검증
export function validateSession(req: NextRequest): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // 세션 쿠키 검증
  const sessionCookie = req.cookies.get('next-auth.session-token')
  if (!sessionCookie) {
    issues.push('Missing session cookie')
  }

  // CSRF 토큰 검증
  const csrfToken = req.headers.get('x-csrf-token')
  if (req.method !== 'GET' && !csrfToken) {
    issues.push('Missing CSRF token')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

// 보안 헤더 생성
export function createSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  }
}

// 보안 이벤트 로깅
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown'
  }

  console.warn('Security Event:', JSON.stringify(logEntry))

  // TODO: 실제 보안 로깅 시스템에 전송
  // await sendToSecurityLog(logEntry)
}

// 의심스러운 활동 감지
export function detectSuspiciousActivity(req: NextRequest): {
  suspicious: boolean
  reasons: string[]
} {
  const reasons: string[] = []

  // 비정상적인 User-Agent
  const userAgent = req.headers.get('user-agent')
  if (userAgent && (
    userAgent.includes('bot') ||
    userAgent.includes('crawler') ||
    userAgent.includes('spider') ||
    userAgent.length < 10
  )) {
    reasons.push('Suspicious User-Agent')
  }

  // 비정상적인 요청 빈도 (간단한 검증)
  const now = Date.now()
  const lastRequest = req.headers.get('x-last-request')
  if (lastRequest) {
    const timeDiff = now - parseInt(lastRequest)
    if (timeDiff < 100) { // 100ms 미만
      reasons.push('High request frequency')
    }
  }

  // 비정상적인 경로
  const pathname = req.nextUrl.pathname
  if (pathname.includes('..') || pathname.includes('//')) {
    reasons.push('Suspicious path')
  }

  return {
    suspicious: reasons.length > 0,
    reasons
  }
}

// 보안 점수 계산
export function calculateSecurityScore(req: NextRequest): number {
  let score = 100

  // 헤더 검증
  const headerValidation = validateRequestHeaders(req)
  if (!headerValidation.valid) {
    score -= headerValidation.issues.length * 10
  }

  // 세션 검증
  const sessionValidation = validateSession(req)
  if (!sessionValidation.valid) {
    score -= sessionValidation.issues.length * 15
  }

  // 의심스러운 활동
  const suspiciousActivity = detectSuspiciousActivity(req)
  if (suspiciousActivity.suspicious) {
    score -= suspiciousActivity.reasons.length * 20
  }

  return Math.max(0, score)
}
