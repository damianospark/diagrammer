export type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'
export type OrgRole = 'MEMBER' | 'ADMIN' | 'OWNER'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'FREE' | 'PRO' | 'TEAM'
  status: OrgStatus
  createdAt: Date
  updatedAt: Date
}

export interface OrgMember {
  id: string
  orgId: string
  userId: string
  role: OrgRole
  joinedAt: Date
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export interface OrgInvitation {
  id: string
  orgId: string
  email: string
  role: OrgRole
  invitedBy: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: Date
  createdAt: Date
  acceptedAt?: Date | null
}

export interface OrgSettings {
  id: string
  orgId: string
  allowMemberInvites: boolean
  requireApprovalForJoins: boolean
  defaultRole: OrgRole
  maxMembers: number
  features: {
    collaboration: boolean
    apiAccess: boolean
    sso: boolean
    auditLogs: boolean
  }
}

export interface OrgUsage {
  orgId: string
  plan: 'FREE' | 'PRO' | 'TEAM'
  members: {
    current: number
    limit: number
  }
  sessions: {
    used: number
    limit: number | 'unlimited'
  }
  messages: {
    used: number
    limit: number
    resetAt: Date
  }
  nodes: {
    used: number
    limit: number
  }
  storage: {
    used: number // bytes
    limit: number | 'unlimited' // bytes
  }
  api: {
    requests: number
    limit: number | 'unlimited'
    resetAt: Date
  }
}

export interface OrgActivity {
  id: string
  orgId: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  metadata?: Record<string, any>
  createdAt: Date
  user?: {
    id: string
    name?: string | null
    email?: string | null
  }
}

export interface OrgBilling {
  orgId: string
  stripeCustomerId?: string
  plan: 'FREE' | 'PRO' | 'TEAM'
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  seats: number
  pricePerSeat: number
  currency: string
  nextBillingDate?: Date
}

export interface OrgFeatureFlag {
  id: string
  orgId: string
  key: string
  enabled: boolean
  rollout: number // 0-100%
  conditions?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface OrgIntegration {
  id: string
  orgId: string
  type: 'sso' | 'webhook' | 'api' | 'slack' | 'teams'
  name: string
  config: Record<string, any>
  status: 'active' | 'inactive' | 'error'
  lastSyncAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface OrgWebhook {
  id: string
  orgId: string
  url: string
  events: string[]
  secret: string
  status: 'active' | 'inactive'
  lastDelivery?: Date
  failureCount: number
  createdAt: Date
  updatedAt: Date
}

export interface OrgApiKey {
  id: string
  orgId: string
  name: string
  key: string
  permissions: string[]
  lastUsedAt?: Date
  expiresAt?: Date
  status: 'active' | 'inactive' | 'expired'
  createdAt: Date
  updatedAt: Date
}
