import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler failed:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id
  const customerId = session.customer as string
  const email = session.customer_details?.email

  if (!userId) {
    throw new Error("No user ID in checkout session")
  }

  // Create or update billing profile
  await prisma.billingProfile.upsert({
    where: { userId },
    update: {
      stripeCustomerId: customerId,
      email: email || undefined,
      plan: 'PRO', // Default to PRO for now
      status: 'ACTIVE'
    },
    create: {
      userId,
      stripeCustomerId: customerId,
      email: email || undefined,
      plan: 'PRO',
      status: 'ACTIVE'
    }
  })

  // Update user email if not set
  if (email) {
    await prisma.user.update({
      where: { id: userId },
      data: { email }
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const billingProfile = await prisma.billingProfile.findUnique({
    where: { stripeCustomerId: customerId }
  })

  if (!billingProfile) {
    console.error("Billing profile not found for customer:", customerId)
    return
  }

  const status = subscription.status === 'active' ? 'ACTIVE' : 'CANCELED'

  await prisma.billingProfile.update({
    where: { id: billingProfile.id },
    data: {
      status,
      renewedAt: new Date()
    }
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await prisma.billingProfile.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      status: 'CANCELED',
      plan: 'FREE'
    }
  })
}
