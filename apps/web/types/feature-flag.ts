export interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  enabled: boolean
  rollout: number // 0-100%
  conditions?: FeatureFlagCondition[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface FeatureFlagCondition {
  id: string
  type: 'user' | 'org' | 'plan' | 'date' | 'percentage' | 'custom'
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains' | 'regex'
  value: any
  metadata?: Record<string, any>
}

export interface FeatureFlagEvaluation {
  flagKey: string
  enabled: boolean
  reason: 'enabled' | 'disabled' | 'condition_not_met' | 'rollout_not_selected' | 'flag_not_found'
  conditions?: {
    met: boolean
    condition: FeatureFlagCondition
  }[]
  metadata?: Record<string, any>
}

export interface FeatureFlagUsage {
  flagKey: string
  evaluations: {
    total: number
    enabled: number
    disabled: number
  }
  byUser: Record<string, number>
  byOrg: Record<string, number>
  byPlan: Record<string, number>
  lastEvaluated?: Date
}

export interface FeatureFlagHistory {
  id: string
  flagId: string
  action: 'created' | 'updated' | 'enabled' | 'disabled' | 'deleted'
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  userId: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface FeatureFlagTargeting {
  id: string
  flagId: string
  type: 'user' | 'org' | 'segment'
  targetId: string
  enabled: boolean
  conditions?: FeatureFlagCondition[]
  createdAt: Date
  updatedAt: Date
}

export interface FeatureFlagSegment {
  id: string
  name: string
  description?: string
  conditions: FeatureFlagCondition[]
  userCount?: number
  orgCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface FeatureFlagEnvironment {
  id: string
  name: string
  description?: string
  key: string
  enabled: boolean
  flags: Record<string, boolean>
  createdAt: Date
  updatedAt: Date
}

export interface FeatureFlagVariant {
  id: string
  flagId: string
  name: string
  key: string
  value: any
  weight: number // 0-100%
  conditions?: FeatureFlagCondition[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface FeatureFlagExperiment {
  id: string
  flagId: string
  name: string
  description?: string
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'
  variants: FeatureFlagVariant[]
  metrics: {
    name: string
    type: 'conversion' | 'revenue' | 'engagement' | 'custom'
    goal: 'increase' | 'decrease' | 'maintain'
  }[]
  startDate: Date
  endDate?: Date
  results?: {
    variant: string
    participants: number
    conversions: number
    conversionRate: number
    confidence: number
    significance: 'low' | 'medium' | 'high'
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface FeatureFlagWebhook {
  id: string
  url: string
  events: ('flag.created' | 'flag.updated' | 'flag.deleted' | 'flag.enabled' | 'flag.disabled')[]
  secret: string
  status: 'active' | 'inactive'
  lastDelivery?: Date
  failureCount: number
  createdAt: Date
  updatedAt: Date
}

export interface FeatureFlagApiKey {
  id: string
  name: string
  key: string
  permissions: ('read' | 'write' | 'admin')[]
  environments: string[]
  lastUsedAt?: Date
  expiresAt?: Date
  status: 'active' | 'inactive' | 'expired'
  createdAt: Date
  updatedAt: Date
}

export type FeatureFlagEvent =
  | 'flag.created'
  | 'flag.updated'
  | 'flag.deleted'
  | 'flag.enabled'
  | 'flag.disabled'
  | 'flag.rollout_changed'
  | 'flag.condition_added'
  | 'flag.condition_removed'
  | 'flag.condition_updated'
  | 'experiment.started'
  | 'experiment.paused'
  | 'experiment.completed'
  | 'experiment.cancelled'
  | 'segment.created'
  | 'segment.updated'
  | 'segment.deleted'
  | 'targeting.created'
  | 'targeting.updated'
  | 'targeting.deleted'
