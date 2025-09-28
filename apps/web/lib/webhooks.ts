import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { randomBytes, createHmac } from "crypto"

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  status: 'active' | 'inactive'
  lastDelivery?: Date
  failureCount: number
  createdAt: Date
  updatedAt: Date
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: string
  payload: any
  status: 'pending' | 'delivered' | 'failed'
  responseCode?: number
  responseBody?: string
  attempts: number
  maxAttempts: number
  nextRetryAt?: Date
  deliveredAt?: Date
  createdAt: Date
}

export async function createWebhook(data: {
  name: string
  url: string
  events: string[]
  status?: 'active' | 'inactive'
  userId: string
}): Promise<Webhook> {
  const secret = randomBytes(32).toString("hex")

  // TODO: 실제 웹훅 테이블에 저장
  const newWebhook: Webhook = {
    id: Date.now().toString(),
    name: data.name,
    url: data.url,
    events: data.events,
    secret,
    status: data.status || 'active',
    failureCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // 감사 로그 기록
  await createAuditLog({
    action: "webhook.created",
    resource: "webhook",
    resourceId: newWebhook.id,
    userId: data.userId,
    metadata: {
      name: data.name,
      url: data.url,
      events: data.events
    }
  })

  return newWebhook
}

export async function getWebhooks(userId: string): Promise<Webhook[]> {
  // TODO: 실제 웹훅 테이블에서 조회
  return []
}

export async function getWebhookById(id: string): Promise<Webhook | null> {
  // TODO: 실제 웹훅 테이블에서 조회
  return null
}

export async function updateWebhook(
  id: string,
  data: {
    name?: string
    url?: string
    events?: string[]
    status?: 'active' | 'inactive'
  },
  userId: string
): Promise<Webhook | null> {
  // TODO: 실제 웹훅 테이블 업데이트
  const updatedWebhook: Webhook = {
    id,
    name: data.name || "Webhook",
    url: data.url || "",
    events: data.events || [],
    secret: "secret",
    status: data.status || 'active',
    failureCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // 감사 로그 기록
  await createAuditLog({
    action: "webhook.updated",
    resource: "webhook",
    resourceId: id,
    userId,
    metadata: data
  })

  return updatedWebhook
}

export async function deleteWebhook(id: string, userId: string): Promise<boolean> {
  // TODO: 실제 웹훅 테이블에서 삭제
  // const deleted = await prisma.webhook.delete({ where: { id } })

  // 감사 로그 기록
  await createAuditLog({
    action: "webhook.deleted",
    resource: "webhook",
    resourceId: id,
    userId
  })

  return true
}

export async function triggerWebhook(
  event: string,
  payload: any,
  userId?: string
): Promise<void> {
  // TODO: 해당 이벤트를 구독하는 웹훅들 조회
  const webhooks: Webhook[] = []

  for (const webhook of webhooks) {
    if (webhook.status === 'active' && webhook.events.includes(event)) {
      await deliverWebhook(webhook, event, payload)
    }
  }
}

export async function deliverWebhook(
  webhook: Webhook,
  event: string,
  payload: any
): Promise<WebhookDelivery> {
  const delivery: WebhookDelivery = {
    id: Date.now().toString(),
    webhookId: webhook.id,
    event,
    payload,
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date()
  }

  try {
    const signature = generateWebhookSignature(webhook.secret, JSON.stringify(payload))

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': signature,
        'X-Webhook-Delivery': delivery.id
      },
      body: JSON.stringify(payload)
    })

    delivery.status = response.ok ? 'delivered' : 'failed'
    delivery.responseCode = response.status
    delivery.responseBody = await response.text()
    delivery.deliveredAt = new Date()

    if (response.ok) {
      // 성공 시 실패 카운트 리셋
      // await prisma.webhook.update({
      //   where: { id: webhook.id },
      //   data: { 
      //     lastDelivery: new Date(),
      //     failureCount: 0 
      //   }
      // })
    } else {
      // 실패 시 카운트 증가
      // await prisma.webhook.update({
      //   where: { id: webhook.id },
      //   data: { 
      //     failureCount: { increment: 1 }
      //   }
      // })
    }

  } catch (error) {
    delivery.status = 'failed'
    delivery.responseBody = error instanceof Error ? error.message : 'Unknown error'

    // 실패 시 카운트 증가
    // await prisma.webhook.update({
    //   where: { id: webhook.id },
    //   data: { 
    //     failureCount: { increment: 1 }
    //   }
    // })
  }

  // TODO: 웹훅 전송 기록 저장
  // await prisma.webhookDelivery.create({ data: delivery })

  return delivery
}

export function generateWebhookSignature(secret: string, payload: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  return `sha256=${hmac.digest('hex')}`
}

export function verifyWebhookSignature(
  signature: string,
  secret: string,
  payload: string
): boolean {
  const expectedSignature = generateWebhookSignature(secret, payload)
  return signature === expectedSignature
}

export async function retryFailedWebhooks(): Promise<void> {
  // TODO: 실패한 웹훅 재시도 로직
  // const failedDeliveries = await prisma.webhookDelivery.findMany({
  //   where: {
  //     status: 'failed',
  //     attempts: { lt: 3 },
  //     nextRetryAt: { lte: new Date() }
  //   }
  // })

  // for (const delivery of failedDeliveries) {
  //   const webhook = await getWebhookById(delivery.webhookId)
  //   if (webhook) {
  //     await deliverWebhook(webhook, delivery.event, delivery.payload)
  //   }
  // }
}

export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 50
): Promise<WebhookDelivery[]> {
  // TODO: 웹훅 전송 기록 조회
  return []
}

export async function getWebhookStats(webhookId: string) {
  // TODO: 웹훅 통계 조회
  return {
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    successRate: 0,
    averageResponseTime: 0,
    lastDelivery: null
  }
}

export async function testWebhook(
  webhookId: string,
  testPayload: any
): Promise<{
  success: boolean
  responseCode?: number
  responseBody?: string
  error?: string
}> {
  const webhook = await getWebhookById(webhookId)
  if (!webhook) {
    return { success: false, error: "Webhook not found" }
  }

  try {
    const delivery = await deliverWebhook(webhook, "test", testPayload)
    return {
      success: delivery.status === 'delivered',
      responseCode: delivery.responseCode,
      responseBody: delivery.responseBody
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
