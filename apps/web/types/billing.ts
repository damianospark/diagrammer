export type Plan = 'FREE' | 'PRO' | 'TEAM'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID'

export interface BillingProfile {
  id: string
  userId: string
  stripeCustomerId?: string | null
  email?: string | null
  plan: Plan
  status: SubscriptionStatus
  renewedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface StripeCheckoutSession {
  id: string
  url: string
  customer: string
  client_reference_id: string
  mode: 'subscription'
  status: 'open' | 'complete' | 'expired'
}

export interface StripeSubscription {
  id: string
  customer: string
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  items: {
    data: Array<{
      price: {
        id: string
        nickname?: string
        unit_amount: number
        currency: string
        recurring: {
          interval: 'month' | 'year'
        }
      }
    }>
  }
}

export interface StripeCustomer {
  id: string
  email?: string
  name?: string
  created: number
  default_source?: string
  subscription?: string
}

export interface StripePrice {
  id: string
  nickname?: string
  unit_amount: number
  currency: string
  recurring: {
    interval: 'month' | 'year'
  }
  active: boolean
}

export interface StripeProduct {
  id: string
  name: string
  description?: string
  active: boolean
  metadata: Record<string, string>
}

export interface StripeInvoice {
  id: string
  customer: string
  subscription?: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  amount_paid: number
  amount_due: number
  currency: string
  created: number
  period_start: number
  period_end: number
  hosted_invoice_url?: string
  invoice_pdf?: string
}

export interface StripePaymentMethod {
  id: string
  type: 'card' | 'bank_account' | 'sepa_debit'
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
  billing_details: {
    name?: string
    email?: string
  }
}

export interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: any
  }
  created: number
  livemode: boolean
  pending_webhooks: number
  request?: {
    id: string
    idempotency_key?: string
  }
}

export interface BillingUsage {
  plan: Plan
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
  exports: {
    used: number
    limit: number | 'unlimited'
  }
  api: {
    used: number
    limit: number | 'unlimited'
  }
}

export interface BillingHistory {
  id: string
  type: 'subscription' | 'payment' | 'refund'
  amount: number
  currency: string
  status: 'succeeded' | 'failed' | 'pending'
  description: string
  date: Date
  invoiceUrl?: string
  receiptUrl?: string
}
