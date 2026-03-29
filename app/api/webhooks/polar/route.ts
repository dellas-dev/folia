import { sendPurchaseConfirmationEmail, sendSubscriptionStatusEmail } from '@/lib/email/resend'
import { resolvePolarPlanFromMetadata, verifyPolarWebhook } from '@/lib/payments/polar'
import { applyPaymentToProfile, cancelSubscriptionForProfile, recordPaymentEventIfNew } from '@/lib/payments/shared'

export async function POST(request: Request) {
  const rawBody = await request.text()

  try {
    const event = await verifyPolarWebhook(rawBody, request.headers)
    const eventId = typeof event.id === 'string' ? event.id : crypto.randomUUID()
    const eventType = typeof event.type === 'string' ? event.type : 'unknown'
    const isNew = await recordPaymentEventIfNew(eventId, 'polar', eventType)

    if (!isNew) {
      return Response.json({ ok: true, duplicate: true })
    }

    const data = event.data ?? {}
    const metadata = typeof data.metadata === 'object' && data.metadata ? data.metadata as Record<string, unknown> : undefined
    const plan = resolvePolarPlanFromMetadata(metadata)
    const email = typeof data.customer_email === 'string'
      ? data.customer_email
      : typeof (data.customer as { email?: unknown } | undefined)?.email === 'string'
        ? (data.customer as { email: string }).email
        : null
    const clerkUserId = typeof metadata?.clerk_user_id === 'string' ? metadata.clerk_user_id : null

    if ((eventType === 'order.created' || eventType === 'order.paid' || eventType === 'subscription.created' || eventType === 'subscription.active') && plan) {
      const result = await applyPaymentToProfile({
        eventId,
        eventType,
        provider: 'polar',
        clerkUserId,
        email,
        plan,
        paymentId: typeof data.id === 'string' ? data.id : eventId,
        subscriptionId: typeof data.subscription_id === 'string' ? data.subscription_id : typeof data.id === 'string' ? data.id : null,
        subscriptionPeriodEnd: typeof data.current_period_end === 'string' ? data.current_period_end : null,
        customerId: typeof data.customer_id === 'string' ? data.customer_id : null,
        currency: 'USD',
        amountUsd: typeof data.total_amount === 'number' ? data.total_amount / 100 : null,
        paymentStatus: 'success',
      })

      await sendPurchaseConfirmationEmail({
        to: result.profile.email,
        planName: result.plan,
        creditsAdded: result.creditsAdded,
      })

      return Response.json({ ok: true })
    }

    if (eventType === 'subscription.revoked' || eventType === 'subscription.canceled') {
      const profile = await cancelSubscriptionForProfile({ clerkUserId, email })

      await sendSubscriptionStatusEmail({
        to: profile.email,
        subject: 'Your Folia subscription was canceled',
        body: 'Your subscription status has been updated to canceled. Your remaining credits stay available.',
      })

      return Response.json({ ok: true })
    }

    return Response.json({ ok: true, ignored: true })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid webhook request.' },
      { status: 400 }
    )
  }
}
