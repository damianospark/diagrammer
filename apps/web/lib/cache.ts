// 간단한 메모리 캐시 구현
// 실제 프로덕션에서는 Redis를 사용하는 것이 좋습니다

interface CacheItem<T> {
  value: T
  expires: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize = 1000
  private defaultTTL = 300000 // 5분

  set<T>(key: string, value: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictExpired()
      if (this.cache.size >= this.maxSize) {
        // 가장 오래된 항목 제거
        const firstKey = this.cache.keys().next().value
        if (firstKey) {
          this.cache.delete(firstKey)
        }
      }
    }

    const expires = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { value, expires })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private evictExpired(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((item, key) => {
      if (now > item.expires) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }
}

export const cache = new MemoryCache()

// 캐시 키 생성 헬퍼
export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

// 캐시 래퍼 함수
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const value = await fetcher()
  cache.set(key, value, ttl)
  return value
}

// 사용자별 캐시 키
export function getUserCacheKey(userId: string, suffix: string): string {
  return createCacheKey('user', userId, suffix)
}

// 조직별 캐시 키
export function getOrgCacheKey(orgId: string, suffix: string): string {
  return createCacheKey('org', orgId, suffix)
}

// 플랜별 캐시 키
export function getPlanCacheKey(plan: string, suffix: string): string {
  return createCacheKey('plan', plan, suffix)
}

// 캐시 무효화 헬퍼
export function invalidateUserCache(userId: string): void {
  const keys = cache.keys().filter(key => key.startsWith(`user:${userId}:`))
  keys.forEach(key => cache.delete(key))
}

export function invalidateOrgCache(orgId: string): void {
  const keys = cache.keys().filter(key => key.startsWith(`org:${orgId}:`))
  keys.forEach(key => cache.delete(key))
}

export function invalidatePlanCache(plan: string): void {
  const keys = cache.keys().filter(key => key.startsWith(`plan:${plan}:`))
  keys.forEach(key => cache.delete(key))
}

// 캐시 통계
export function getCacheStats() {
  return {
    size: cache.size(),
    keys: cache.keys(),
    // Edge Runtime에서는 process.memoryUsage() 사용 불가
    memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 }
  }
}
