import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function createCheckoutSession({
  userId,
  priceId,
  successUrl,
  cancelUrl
}: {
  userId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  })
}

export async function createPortalSession({
  customerId,
  returnUrl
}: {
  customerId: string
  returnUrl: string
}) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
