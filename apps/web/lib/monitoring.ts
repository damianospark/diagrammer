import { NextRequest, NextResponse } from "next/server"

// 메트릭 수집
interface Metric {
  name: string
  value: number
  timestamp: Date
  tags?: Record<string, string>
}

class MetricsCollector {
  private metrics: Metric[] = []
  private maxMetrics = 10000

  record(name: string, value: number, tags?: Record<string, string>): void {
    if (this.metrics.length >= this.maxMetrics) {
      this.metrics.shift() // 가장 오래된 메트릭 제거
    }

    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      tags
    })
  }

  getMetrics(name?: string, tags?: Record<string, string>): Metric[] {
    let filtered = this.metrics

    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }

    if (tags) {
      filtered = filtered.filter(m => {
        return Object.entries(tags).every(([key, value]) =>
          m.tags && m.tags[key] === value
        )
      })
    }

    return filtered
  }

  getStats(name: string): {
    count: number
    sum: number
    avg: number
    min: number
    max: number
  } {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 }
    }

    const values = metrics.map(m => m.value)
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { count: metrics.length, sum, avg, min, max }
  }

  clear(): void {
    this.metrics = []
  }
}

export const metrics = new MetricsCollector()

// HTTP 요청 메트릭
export function recordHttpRequest(
  req: NextRequest,
  res: NextResponse,
  duration: number
): void {
  const method = req.method
  const pathname = req.nextUrl.pathname
  const statusCode = res.status

  // 요청 수
  metrics.record('http.requests', 1, {
    method,
    pathname,
    status: statusCode.toString()
  })

  // 응답 시간
  metrics.record('http.duration', duration, {
    method,
    pathname,
    status: statusCode.toString()
  })

  // 에러율
  if (statusCode >= 400) {
    metrics.record('http.errors', 1, {
      method,
      pathname,
    })
  }
}

// 데이터베이스 메트릭
export function recordDatabaseQuery(
  query: string,
  duration: number,
  success: boolean
): void {
  metrics.record('db.queries', 1, {
    query: query.substring(0, 50), // 쿼리 이름만
    success: success.toString()
  })

  metrics.record('db.duration', duration, {
    query: query.substring(0, 50),
    success: success.toString()
  })

  if (!success) {
    metrics.record('db.errors', 1, {
      query: query.substring(0, 50)
    })
  }
}

// 캐시 메트릭
export function recordCacheHit(key: string): void {
  metrics.record('cache.hits', 1, { key })
}

export function recordCacheMiss(key: string): void {
  metrics.record('cache.misses', 1, { key })
}

// 비즈니스 메트릭
export function recordUserAction(action: string, userId: string): void {
  metrics.record('user.actions', 1, { action, userId })
}

export function recordSubscriptionEvent(event: string, plan: string): void {
  metrics.record('subscription.events', 1, { event, plan })
}

export function recordApiUsage(endpoint: string, userId: string): void {
  metrics.record('api.usage', 1, { endpoint, userId })
}

// 시스템 메트릭 (Edge Runtime 호환)
export function recordSystemMetrics(): void {
  // Edge Runtime에서는 process.memoryUsage() 사용 불가
  // 대신 기본값 사용
  const memUsage = { heapUsed: 0, external: 0, rss: 0 }
  const cpuUsage = { user: 0, system: 0 }

  metrics.record('system.memory.heap', memUsage.heapUsed)
  metrics.record('system.memory.external', memUsage.external)
  metrics.record('system.memory.rss', memUsage.rss)
  metrics.record('system.cpu.user', cpuUsage.user)
  metrics.record('system.cpu.system', cpuUsage.system)
}

// 로깅 시스템
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
  context?: Record<string, any>
  userId?: string
  requestId?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000

  log(level: LogEntry['level'], message: string, context?: Record<string, any>): void {
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift() // 가장 오래된 로그 제거
    }

    this.logs.push({
      level,
      message,
      timestamp: new Date(),
      context
    })

    // 콘솔에 출력
    const logMessage = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`
    if (context) {
      console.log(logMessage, context)
    } else {
      console.log(logMessage)
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context)
  }

  getLogs(level?: LogEntry['level'], limit: number = 100): LogEntry[] {
    let filtered = this.logs

    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }

    return filtered.slice(-limit)
  }

  clear(): void {
    this.logs = []
  }
}

export const logger = new Logger()

// 헬스 체크
export interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  lastCheck: Date
  error?: string
  metadata?: Record<string, any>
}

class HealthChecker {
  private checks: Map<string, HealthCheck> = new Map()

  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now()
    try {
      // TODO: 실제 데이터베이스 연결 테스트
      const responseTime = Date.now() - start
      const check: HealthCheck = {
        name: 'database',
        status: 'healthy',
        responseTime,
        lastCheck: new Date()
      }
      this.checks.set('database', check)
      return check
    } catch (error) {
      const responseTime = Date.now() - start
      const check: HealthCheck = {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      this.checks.set('database', check)
      return check
    }
  }

  async checkStripe(): Promise<HealthCheck> {
    const start = Date.now()
    try {
      // TODO: 실제 Stripe API 테스트
      const responseTime = Date.now() - start
      const check: HealthCheck = {
        name: 'stripe',
        status: 'healthy',
        responseTime,
        lastCheck: new Date()
      }
      this.checks.set('stripe', check)
      return check
    } catch (error) {
      const responseTime = Date.now() - start
      const check: HealthCheck = {
        name: 'stripe',
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      this.checks.set('stripe', check)
      return check
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    const start = Date.now()
    try {
      // TODO: 실제 Redis 연결 테스트
      const responseTime = Date.now() - start
      const check: HealthCheck = {
        name: 'redis',
        status: 'healthy',
        responseTime,
        lastCheck: new Date()
      }
      this.checks.set('redis', check)
      return check
    } catch (error) {
      const responseTime = Date.now() - start
      const check: HealthCheck = {
        name: 'redis',
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      this.checks.set('redis', check)
      return check
    }
  }

  async runAllChecks(): Promise<HealthCheck[]> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkStripe(),
      this.checkRedis()
    ])

    return checks
  }

  getCheck(name: string): HealthCheck | undefined {
    return this.checks.get(name)
  }

  getAllChecks(): HealthCheck[] {
    return Array.from(this.checks.values())
  }
}

export const healthChecker = new HealthChecker()

// 알림 시스템
export interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  resolved: boolean
  metadata?: Record<string, any>
}

class AlertManager {
  private alerts: Alert[] = []
  private maxAlerts = 100

  createAlert(
    type: Alert['type'],
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Alert {
    const alert: Alert = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    }

    if (this.alerts.length >= this.maxAlerts) {
      this.alerts.shift() // 가장 오래된 알림 제거
    }

    this.alerts.push(alert)
    logger.warn(`Alert created: ${title}`, { alert })

    return alert
  }

  resolveAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id)
    if (alert) {
      alert.resolved = true
      logger.info(`Alert resolved: ${alert.title}`, { alertId: id })
      return true
    }
    return false
  }

  getAlerts(resolved?: boolean): Alert[] {
    if (resolved === undefined) {
      return this.alerts
    }
    return this.alerts.filter(a => a.resolved === resolved)
  }

  getActiveAlerts(): Alert[] {
    return this.getAlerts(false)
  }
}

export const alertManager = new AlertManager()

// 모니터링 대시보드 데이터
export function getMonitoringData() {
  return {
    metrics: {
      http: metrics.getStats('http.requests'),
      database: metrics.getStats('db.queries'),
      cache: {
        hits: metrics.getStats('cache.hits'),
        misses: metrics.getStats('cache.misses')
      }
    },
    health: healthChecker.getAllChecks(),
    alerts: alertManager.getActiveAlerts(),
    logs: logger.getLogs('error', 50),
    system: {
      // Edge Runtime에서는 process API 사용 불가
      memory: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 },
      uptime: 0,
      version: 'edge'
    }
  }
}
