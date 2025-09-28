export interface Entitlements {
  seats: number
  sessions: number | 'unlimited'
  messagesPerDay: number
  maxNodes: number
  exports: string[]
  publicShare: boolean
  revision: string | 'none' | 'unlimited'
  collab: boolean
  queue: 'standard' | 'high' | 'highest'
  api: 'none' | 'read' | 'readwrite'
  sso: boolean | 'addon'
}

export const ENTITLEMENTS: Record<string, Entitlements> = {
  free: {
    seats: 1,
    sessions: 2,
    messagesPerDay: 100,
    maxNodes: 100,
    exports: ["png"],
    publicShare: false,
    revision: "none",
    collab: false,
    queue: "standard",
    api: "none",
    sso: false
  },
  pro: {
    seats: 1,
    sessions: 200,
    messagesPerDay: 2000,
    maxNodes: 1000,
    exports: ["png", "pptx"],
    publicShare: true,
    revision: "10",
    collab: false,
    queue: "high",
    api: "read",
    sso: false
  },
  team: {
    seats: 5,
    sessions: "unlimited",
    messagesPerDay: 10000,
    maxNodes: 5000,
    exports: ["png", "pptx", "slides"],
    publicShare: true,
    revision: "unlimited",
    collab: true,
    queue: "highest",
    api: "readwrite",
    sso: "addon"
  }
}

export function getEntitlements(plan: string): Entitlements {
  return ENTITLEMENTS[plan] || ENTITLEMENTS.free
}

export function hasFeature(plan: string, feature: keyof Entitlements): boolean {
  const entitlements = getEntitlements(plan)
  return Boolean(entitlements[feature])
}

export function canExport(plan: string, format: string): boolean {
  const entitlements = getEntitlements(plan)
  return entitlements.exports.includes(format.toLowerCase())
}

export function canCreateSession(plan: string, currentSessions: number): boolean {
  const entitlements = getEntitlements(plan)
  if (entitlements.sessions === "unlimited") return true
  return currentSessions < entitlements.sessions
}

export function canSendMessage(plan: string, messagesToday: number): boolean {
  const entitlements = getEntitlements(plan)
  return messagesToday < entitlements.messagesPerDay
}

export function canCreateNode(plan: string, currentNodes: number): boolean {
  const entitlements = getEntitlements(plan)
  return currentNodes < entitlements.maxNodes
}

export function canUsePublicShare(plan: string): boolean {
  return hasFeature(plan, 'publicShare')
}

export function canUseCollaboration(plan: string): boolean {
  return hasFeature(plan, 'collab')
}

export function canUseAPI(plan: string, access: 'read' | 'write' = 'read'): boolean {
  const entitlements = getEntitlements(plan)
  if (entitlements.api === 'none') return false
  if (access === 'write') return entitlements.api === 'readwrite'
  return entitlements.api === 'read' || entitlements.api === 'readwrite'
}

export function getQueuePriority(plan: string): 'standard' | 'high' | 'highest' {
  const entitlements = getEntitlements(plan)
  return entitlements.queue
}

export function getRevisionLimit(plan: string): number | 'unlimited' {
  const entitlements = getEntitlements(plan)
  if (entitlements.revision === 'unlimited') return 'unlimited'
  if (entitlements.revision === 'none') return 0
  return parseInt(entitlements.revision) || 0
}

export function canUseSSO(plan: string): boolean {
  const entitlements = getEntitlements(plan)
  return entitlements.sso === true || entitlements.sso === 'addon'
}

export function getSeatLimit(plan: string): number {
  const entitlements = getEntitlements(plan)
  return entitlements.seats
}

// 플랜별 기능 비교를 위한 유틸리티
export function getPlanComparison() {
  const plans = Object.keys(ENTITLEMENTS)
  const features = Object.keys(ENTITLEMENTS.free) as (keyof Entitlements)[]

  return features.map(feature => ({
    feature,
    plans: plans.reduce((acc, plan) => {
      acc[plan] = ENTITLEMENTS[plan][feature]
      return acc
    }, {} as Record<string, any>)
  }))
}

// 플랜 업그레이드 권장사항
export function getUpgradeRecommendation(currentPlan: string, usage: {
  sessions: number
  messagesToday: number
  maxNodes: number
  needsPublicShare: boolean
  needsCollaboration: boolean
  needsAPI: boolean
}): string | null {
  const current = getEntitlements(currentPlan)

  // 세션 제한 체크
  if (current.sessions !== 'unlimited' && usage.sessions >= current.sessions * 0.8) {
    return 'pro'
  }

  // 메시지 제한 체크
  if (usage.messagesToday >= current.messagesPerDay * 0.8) {
    return 'pro'
  }

  // 노드 제한 체크
  if (usage.maxNodes >= current.maxNodes * 0.8) {
    return 'pro'
  }

  // 기능 요구사항 체크
  if (usage.needsPublicShare && !current.publicShare) {
    return 'pro'
  }

  if (usage.needsCollaboration && !current.collab) {
    return 'team'
  }

  if (usage.needsAPI && current.api === 'none') {
    return 'pro'
  }

  return null
}