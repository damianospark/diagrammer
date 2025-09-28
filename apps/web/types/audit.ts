export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId?: string
  userId?: string
  orgId?: string
  metadata?: Record<string, any>
  createdAt: Date
  user?: {
    id: string
    name?: string | null
    email?: string | null
  }
  org?: {
    id: string
    name: string
    slug: string
  }
}

export type AuditAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.login'
  | 'user.logout'
  | 'user.role_changed'
  | 'user.status_changed'
  | 'billing.subscription_created'
  | 'billing.subscription_updated'
  | 'billing.subscription_canceled'
  | 'billing.payment_succeeded'
  | 'billing.payment_failed'
  | 'billing.invoice_created'
  | 'billing.invoice_paid'
  | 'billing.invoice_failed'
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  | 'org.member_added'
  | 'org.member_removed'
  | 'org.member_role_changed'
  | 'org.invitation_sent'
  | 'org.invitation_accepted'
  | 'org.invitation_cancelled'
  | 'org.settings_updated'
  | 'org.billing_updated'
  | 'org.plan_changed'
  | 'admin.user_suspended'
  | 'admin.user_unsuspended'
  | 'admin.user_deleted'
  | 'admin.role_changed'
  | 'admin.billing_updated'
  | 'admin.org_suspended'
  | 'admin.org_unsuspended'
  | 'admin.org_deleted'
  | 'admin.feature_flag_updated'
  | 'admin.system_settings_updated'
  | 'api.key_created'
  | 'api.key_updated'
  | 'api.key_deleted'
  | 'api.key_used'
  | 'webhook.created'
  | 'webhook.updated'
  | 'webhook.deleted'
  | 'webhook.delivered'
  | 'webhook.failed'
  | 'integration.created'
  | 'integration.updated'
  | 'integration.deleted'
  | 'integration.activated'
  | 'integration.deactivated'

export type AuditResource =
  | 'user'
  | 'billing'
  | 'organization'
  | 'org_member'
  | 'org_invitation'
  | 'org_settings'
  | 'org_billing'
  | 'feature_flag'
  | 'api_key'
  | 'webhook'
  | 'integration'
  | 'system'

export interface AuditFilter {
  action?: AuditAction | AuditAction[]
  resource?: AuditResource | AuditResource[]
  userId?: string
  orgId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface AuditStats {
  total: number
  byAction: Record<AuditAction, number>
  byResource: Record<AuditResource, number>
  byUser: Array<{
    userId: string
    userName?: string
    count: number
  }>
  byOrg: Array<{
    orgId: string
    orgName: string
    count: number
  }>
  byDate: Array<{
    date: string
    count: number
  }>
}

export interface AuditExport {
  id: string
  userId: string
  orgId?: string
  filters: AuditFilter
  format: 'csv' | 'json' | 'xlsx'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  fileUrl?: string
  expiresAt: Date
  createdAt: Date
  completedAt?: Date
}

export interface AuditAlert {
  id: string
  name: string
  description: string
  conditions: {
    action?: AuditAction | AuditAction[]
    resource?: AuditResource | AuditResource[]
    userId?: string
    orgId?: string
    metadata?: Record<string, any>
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  notifications: {
    email: string[]
    webhook?: string
    slack?: string
  }
  lastTriggered?: Date
  triggerCount: number
  createdAt: Date
  updatedAt: Date
}

export interface AuditRetention {
  id: string
  resource: AuditResource
  retentionDays: number
  enabled: boolean
  lastCleanup?: Date
  nextCleanup?: Date
  createdAt: Date
  updatedAt: Date
}
