import { prisma } from "@/lib/prisma"

export interface AuditLogData {
  action: string
  resource: string
  resourceId?: string
  userId?: string
  orgId?: string
  metadata?: Record<string, any>
}

export async function createAuditLog(data: AuditLogData) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        userId: data.userId,
        orgId: data.orgId,
        metadata: data.metadata || {}
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

// 사용자 관련 감사 로그
export async function logUserAction(
  action: 'created' | 'updated' | 'deleted' | 'login' | 'logout' | 'role_changed' | 'status_changed',
  userId: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    action: `user.${action}`,
    resource: 'user',
    resourceId: userId,
    userId,
    metadata
  })
}

// 결제 관련 감사 로그
export async function logBillingAction(
  action: 'subscription_created' | 'subscription_updated' | 'subscription_canceled' | 'payment_succeeded' | 'payment_failed',
  userId: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    action: `billing.${action}`,
    resource: 'billing',
    userId,
    metadata
  })
}

// 조직 관련 감사 로그
export async function logOrgAction(
  action: 'created' | 'updated' | 'deleted' | 'member_added' | 'member_removed' | 'member_role_changed',
  orgId: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    action: `org.${action}`,
    resource: 'organization',
    resourceId: orgId,
    userId,
    orgId,
    metadata
  })
}

// 관리자 관련 감사 로그
export async function logAdminAction(
  action: 'user_suspended' | 'user_unsuspended' | 'user_deleted' | 'role_changed' | 'billing_updated' | 'org_suspended' | 'org_unsuspended' | 'org_deleted',
  adminUserId: string,
  targetId?: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    action: `admin.${action}`,
    resource: action.includes('user') ? 'user' : 'organization',
    resourceId: targetId,
    userId: adminUserId,
    metadata: {
      ...metadata,
      adminAction: true
    }
  })
}

// API 관련 감사 로그
export async function logApiAction(
  action: 'key_created' | 'key_updated' | 'key_deleted' | 'key_used',
  userId: string,
  keyId?: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    action: `api.${action}`,
    resource: 'api_key',
    resourceId: keyId,
    userId,
    metadata
  })
}

// 웹훅 관련 감사 로그
export async function logWebhookAction(
  action: 'created' | 'updated' | 'deleted' | 'delivered' | 'failed',
  userId: string,
  webhookId?: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    action: `webhook.${action}`,
    resource: 'webhook',
    resourceId: webhookId,
    userId,
    metadata
  })
}

// 통합 관련 감사 로그
export async function logIntegrationAction(
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated',
  userId: string,
  integrationId?: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    action: `integration.${action}`,
    resource: 'integration',
    resourceId: integrationId,
    userId,
    metadata
  })
}

// 기능 플래그 관련 감사 로그
export async function logFeatureFlagAction(
  action: 'created' | 'updated' | 'deleted' | 'enabled' | 'disabled',
  userId: string,
  flagId?: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    action: `feature_flag.${action}`,
    resource: 'feature_flag',
    resourceId: flagId,
    userId,
    metadata
  })
}

// 시스템 관련 감사 로그
export async function logSystemAction(
  action: 'settings_updated' | 'maintenance_started' | 'maintenance_ended' | 'backup_created' | 'backup_restored',
  userId: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    action: `system.${action}`,
    resource: 'system',
    userId,
    metadata: {
      ...metadata,
      systemAction: true
    }
  })
}

// 감사 로그 조회
export async function getAuditLogs(filters: {
  action?: string
  resource?: string
  userId?: string
  orgId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (filters.action) {
    where.action = { contains: filters.action }
  }

  if (filters.resource) {
    where.resource = filters.resource
  }

  if (filters.userId) {
    where.userId = filters.userId
  }

  if (filters.orgId) {
    where.orgId = filters.orgId
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  return prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      org: {
        select: {
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: filters.limit || 100,
    skip: filters.offset || 0
  })
}

// 감사 로그 통계
export async function getAuditStats(filters: {
  startDate?: Date
  endDate?: Date
  orgId?: string
}) {
  const where: any = {}

  if (filters.orgId) {
    where.orgId = filters.orgId
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  const [total, byAction, byResource, byUser, byOrg] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true }
    }),
    prisma.auditLog.groupBy({
      by: ['resource'],
      where,
      _count: { resource: true }
    }),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: { userId: true }
    }),
    prisma.auditLog.groupBy({
      by: ['orgId'],
      where: { ...where, orgId: { not: null } },
      _count: { orgId: true }
    })
  ])

  return {
    total,
    byAction: byAction.reduce((acc, item) => {
      acc[item.action] = item._count.action
      return acc
    }, {} as Record<string, number>),
    byResource: byResource.reduce((acc, item) => {
      acc[item.resource] = item._count.resource
      return acc
    }, {} as Record<string, number>),
    byUser: byUser.map(item => ({
      userId: item.userId!,
      count: item._count.userId
    })),
    byOrg: byOrg.map(item => ({
      orgId: item.orgId!,
      count: item._count.orgId
    }))
  }
}
