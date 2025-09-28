import { prisma } from "@/lib/prisma"

export interface FeatureFlagEvaluation {
  flagKey: string
  enabled: boolean
  reason: 'enabled' | 'disabled' | 'condition_not_met' | 'rollout_not_selected' | 'flag_not_found'
  conditions?: {
    met: boolean
    condition: any
  }[]
  metadata?: Record<string, any>
}

export async function getFeatureFlag(key: string) {
  return prisma.featureFlag.findUnique({
    where: { key }
  })
}

export async function getAllFeatureFlags() {
  return prisma.featureFlag.findMany({
    where: { enabled: true }
  })
}

export async function evaluateFeatureFlag(
  key: string,
  context: {
    userId?: string
    orgId?: string
    plan?: string
    userRole?: string
    metadata?: Record<string, any>
  }
): Promise<FeatureFlagEvaluation> {
  const flag = await getFeatureFlag(key)

  if (!flag) {
    return {
      flagKey: key,
      enabled: false,
      reason: 'flag_not_found'
    }
  }

  if (!flag.enabled) {
    return {
      flagKey: key,
      enabled: false,
      reason: 'disabled'
    }
  }

  // 롤아웃 체크 (간단한 해시 기반)
  if (flag.rollout < 100) {
    const hash = hashString(`${key}-${context.userId || 'anonymous'}`)
    const percentage = hash % 100

    if (percentage >= flag.rollout) {
      return {
        flagKey: key,
        enabled: false,
        reason: 'rollout_not_selected'
      }
    }
  }

  // 조건 체크 (향후 구현)
  // const conditions = await getFeatureFlagConditions(flag.id)
  // const conditionResults = await evaluateConditions(conditions, context)

  return {
    flagKey: key,
    enabled: true,
    reason: 'enabled',
    metadata: {
      rollout: flag.rollout,
      conditions: []
    }
  }
}

export async function evaluateFeatureFlags(
  keys: string[],
  context: {
    userId?: string
    orgId?: string
    plan?: string
    userRole?: string
    metadata?: Record<string, any>
  }
): Promise<Record<string, FeatureFlagEvaluation>> {
  const results: Record<string, FeatureFlagEvaluation> = {}

  for (const key of keys) {
    results[key] = await evaluateFeatureFlag(key, context)
  }

  return results
}

export async function createFeatureFlag(data: {
  key: string
  name: string
  description?: string
  enabled?: boolean
  rollout?: number
  conditions?: any[]
  metadata?: Record<string, any>
}) {
  return prisma.featureFlag.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description,
      enabled: data.enabled || false,
      rollout: data.rollout || 0
    }
  })
}

export async function updateFeatureFlag(
  id: string,
  data: {
    name?: string
    description?: string
    enabled?: boolean
    rollout?: number
    conditions?: any[]
    metadata?: Record<string, any>
  }
) {
  return prisma.featureFlag.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      rollout: data.rollout
    }
  })
}

export async function deleteFeatureFlag(id: string) {
  return prisma.featureFlag.delete({
    where: { id }
  })
}

export async function getFeatureFlagUsage(key: string) {
  // TODO: 실제 사용량 데이터 수집
  return {
    flagKey: key,
    evaluations: {
      total: 0,
      enabled: 0,
      disabled: 0
    },
    byUser: {},
    byOrg: {},
    byPlan: {},
    lastEvaluated: new Date()
  }
}

export async function getFeatureFlagHistory(flagId: string) {
  // TODO: 플래그 변경 이력 구현
  return []
}

// 유틸리티 함수
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32비트 정수로 변환
  }
  return Math.abs(hash)
}

// 클라이언트 사이드에서 사용할 수 있는 훅
export function useFeatureFlag(key: string, context?: {
  userId?: string
  orgId?: string
  plan?: string
  userRole?: string
  metadata?: Record<string, any>
}) {
  // TODO: 클라이언트 사이드에서 플래그 상태 관리
  // 실제로는 서버에서 평가된 결과를 받아와야 함
  return {
    enabled: false,
    loading: true,
    error: null
  }
}

// 플래그 상태 변경 이벤트
export async function toggleFeatureFlag(id: string, enabled: boolean) {
  const flag = await prisma.featureFlag.update({
    where: { id },
    data: { enabled }
  })

  // TODO: 플래그 상태 변경 이벤트 발행
  // await publishFeatureFlagEvent(flag, enabled ? 'enabled' : 'disabled')

  return flag
}

// 플래그 롤아웃 업데이트
export async function updateFeatureFlagRollout(id: string, rollout: number) {
  const flag = await prisma.featureFlag.update({
    where: { id },
    data: { rollout: Math.max(0, Math.min(100, rollout)) }
  })

  // TODO: 롤아웃 변경 이벤트 발행
  // await publishFeatureFlagEvent(flag, 'rollout_changed')

  return flag
}

// 플래그 조건 관리 (향후 구현)
export async function addFeatureFlagCondition(
  flagId: string,
  condition: {
    type: string
    operator: string
    value: any
    metadata?: Record<string, any>
  }
) {
  // TODO: 조건 추가 로직 구현
  return null
}

export async function removeFeatureFlagCondition(flagId: string, conditionId: string) {
  // TODO: 조건 제거 로직 구현
  return null
}

export async function updateFeatureFlagCondition(
  flagId: string,
  conditionId: string,
  updates: {
    type?: string
    operator?: string
    value?: any
    metadata?: Record<string, any>
  }
) {
  // TODO: 조건 업데이트 로직 구현
  return null
}
