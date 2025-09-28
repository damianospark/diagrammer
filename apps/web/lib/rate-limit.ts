import { NextRequest } from "next/server"

interface RateLimitConfig {
  windowMs: number // 시간 윈도우 (밀리초)
  maxRequests: number // 최대 요청 수
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalHits: number
}

// 간단한 메모리 기반 레이트 리미터
// 실제 프로덕션에서는 Redis를 사용하는 것이 좋습니다
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // 1분마다 만료된 항목 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowStart = now - config.windowMs
    const resetTime = now + config.windowMs

    const current = this.requests.get(key)

    if (!current || current.resetTime < now) {
      // 새로운 윈도우 시작
      this.requests.set(key, { count: 1, resetTime })
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime,
        totalHits: 1
      }
    }

    if (current.count >= config.maxRequests) {
      // 한도 초과
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        totalHits: current.count
      }
    }

    // 요청 수 증가
    current.count++
    this.requests.set(key, current)

    return {
      allowed: true,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime,
      totalHits: current.count
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.requests.forEach((data, key) => {
      if (data.resetTime < now) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.requests.delete(key))
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.requests.clear()
  }
}

export const rateLimiter = new RateLimiter()

// 기본 레이트 리미트 설정
export const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 100, // 100회
  keyGenerator: (req) => {
    // IP 주소 기반 키 생성
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `ip:${ip}`
  }
}

// API 엔드포인트별 레이트 리미트 설정
export const apiRateLimitConfigs: Record<string, RateLimitConfig> = {
  '/api/auth/signin': {
    windowMs: 15 * 60 * 1000, // 15분
    maxRequests: 5, // 5회
    keyGenerator: (req) => {
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      return `signin:${ip}`
    }
  },
  '/api/checkout/session': {
    windowMs: 60 * 1000, // 1분
    maxRequests: 10, // 10회
    keyGenerator: (req) => {
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      return `checkout:${ip}`
    }
  },
  '/api/stripe/webhook': {
    windowMs: 60 * 1000, // 1분
    maxRequests: 100, // 100회
    keyGenerator: (req) => {
      // Stripe 웹훅은 IP 기반이 아닌 다른 방식으로 제한
      return 'stripe:webhook'
    }
  },
  '/api/keys': {
    windowMs: 60 * 1000, // 1분
    maxRequests: 20, // 20회
    keyGenerator: (req) => {
      // 사용자 ID 기반 키 생성 (인증된 요청의 경우)
      const authHeader = req.headers.get('authorization')
      if (authHeader) {
        return `api:${authHeader}`
      }
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      return `api:${ip}`
    }
  }
}

// 레이트 리미트 미들웨어
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (req: NextRequest): RateLimitResult => {
    const key = config.keyGenerator ? config.keyGenerator(req) : 'default'
    return rateLimiter.check(key, config)
  }
}

// 특정 엔드포인트의 레이트 리미트 확인
export function checkRateLimit(req: NextRequest, pathname: string): RateLimitResult {
  const config = apiRateLimitConfigs[pathname] || defaultRateLimitConfig
  return createRateLimitMiddleware(config)(req)
}

// 사용자별 레이트 리미트
export function checkUserRateLimit(
  userId: string,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `user:${userId}:${action}`
  return rateLimiter.check(key, config)
}

// 조직별 레이트 리미트
export function checkOrgRateLimit(
  orgId: string,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `org:${orgId}:${action}`
  return rateLimiter.check(key, config)
}

// API 키별 레이트 리미트
export function checkApiKeyRateLimit(
  apiKey: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `apikey:${apiKey}`
  return rateLimiter.check(key, config)
}

// 레이트 리미트 헤더 생성
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Used': result.totalHits.toString()
  }
}

// 레이트 리미트 통계 (Edge Runtime 호환)
export function getRateLimitStats() {
  return {
    activeKeys: rateLimiter['requests'].size,
    // Edge Runtime에서는 process.memoryUsage() 사용 불가
    memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 }
  }
}
