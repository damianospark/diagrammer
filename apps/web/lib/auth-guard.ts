import { auth } from "@/lib/auth"
import { getEntitlements, canCreateSession, canSendMessage, canCreateNode, canUsePublicShare, canUseCollaboration, canUseAPI } from "@/lib/entitlements"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export interface UserPlan {
  plan: string
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID'
  seats: number
  usedSeats: number
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const billingProfile = await prisma.billingProfile.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true
    }
  })

  if (!billingProfile) {
    return {
      plan: 'free',
      status: 'ACTIVE',
      seats: 1,
      usedSeats: 1
    }
  }

  const entitlements = getEntitlements(billingProfile.plan)

  return {
    plan: billingProfile.plan.toLowerCase(),
    status: billingProfile.status,
    seats: entitlements.seats,
    usedSeats: 1 // TODO: 실제 사용 중인 좌석 수 계산
  }
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
    redirect("/")
  }
  return session
}

export async function requireOwner() {
  const session = await requireAuth()
  if (session.user.role !== 'OWNER') {
    redirect("/")
  }
  return session
}

export async function requireActiveSubscription(userId: string) {
  const userPlan = await getUserPlan(userId)
  if (userPlan.status !== 'ACTIVE') {
    redirect("/settings?error=subscription_inactive")
  }
  return userPlan
}

export async function checkEntitlement(
  userId: string,
  check: 'sessions' | 'messages' | 'nodes' | 'publicShare' | 'collaboration' | 'api',
  currentUsage?: number
): Promise<boolean> {
  const userPlan = await getUserPlan(userId)
  const entitlements = getEntitlements(userPlan.plan)

  switch (check) {
    case 'sessions':
      return canCreateSession(userPlan.plan, currentUsage || 0)
    case 'messages':
      return canSendMessage(userPlan.plan, currentUsage || 0)
    case 'nodes':
      return canCreateNode(userPlan.plan, currentUsage || 0)
    case 'publicShare':
      return canUsePublicShare(userPlan.plan)
    case 'collaboration':
      return canUseCollaboration(userPlan.plan)
    case 'api':
      return canUseAPI(userPlan.plan, 'read')
    default:
      return false
  }
}

export async function enforceEntitlement(
  userId: string,
  check: 'sessions' | 'messages' | 'nodes' | 'publicShare' | 'collaboration' | 'api',
  currentUsage?: number
): Promise<void> {
  const hasAccess = await checkEntitlement(userId, check, currentUsage)
  if (!hasAccess) {
    redirect("/pricing?upgrade=true")
  }
}

// 클라이언트 사이드에서 사용할 수 있는 훅
export function useEntitlements(userPlan: string) {
  const entitlements = getEntitlements(userPlan)

  return {
    entitlements,
    canExport: (format: string) => entitlements.exports.includes(format.toLowerCase()),
    canCreateSession: (currentSessions: number) => {
      if (entitlements.sessions === "unlimited") return true
      return currentSessions < entitlements.sessions
    },
    canSendMessage: (messagesToday: number) => messagesToday < entitlements.messagesPerDay,
    canCreateNode: (currentNodes: number) => currentNodes < entitlements.maxNodes,
    canUsePublicShare: () => entitlements.publicShare,
    canUseCollaboration: () => entitlements.collab,
    canUseAPI: (access: 'read' | 'write' = 'read') => {
      if (entitlements.api === 'none') return false
      if (access === 'write') return entitlements.api === 'readwrite'
      return entitlements.api === 'read' || entitlements.api === 'readwrite'
    },
    getQueuePriority: () => entitlements.queue,
    getRevisionLimit: () => {
      if (entitlements.revision === 'unlimited') return 'unlimited'
      if (entitlements.revision === 'none') return 0
      return parseInt(entitlements.revision) || 0
    },
    canUseSSO: () => entitlements.sso === true || entitlements.sso === 'addon',
    getSeatLimit: () => entitlements.seats
  }
}
