import { sendPurchaseConfirmationEmail, sendSubscriptionStatusEmail } from '@/lib/email/resend'
import { resolvePolarPlanFromMetadata, verifyPolarWebhook } from '@/lib/payments/polar'
import { applyPaymentToProfile, cancelSubscriptionForProfile, processPaymentEventOnce } from '@/lib/payments/shared'

export async function POST(request: Request) {
  const rawBody = await request.text()

  try {
    const event = await verifyPolarWebhook(rawBody, request.headers)
    const eventId = typeof event.id === 'string' ? event.id : crypto.randomUUID()
    const eventType = typeof event.type === 'string' ? event.type : 'unknown'
    const data = event.data ?? {}
    const metadata = typeof data.metadata === 'object' && data.metadata ? data.metadata as Record<string, unknown> : undefined
    const plan = resolvePolarPlanFromMetadata(metadata)
    const email = typeof data.customer_email === 'string'
      ? data.customer_email
      : typeof (data.customer as { email?: unknown } | undefined)?.email === 'string'
        ? (data.customer as { email: string }).email
        : null
    const clerkUserId = typeof metadata?.clerk_user_id === 'string' ? metadata.clerk_user_id : null

    const eventResult = await processPaymentEventOnce({
      eventId,
      provider: 'polar',
      type: eventType,
      handler: async () => {
        if ((eventType === 'order.paid' || eventType === 'subscription.active') && plan) {
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

          if (!result.alreadyProcessed) {
            await sendPurchaseConfirmationEmail({
              to: result.profile.email,
              planName: result.plan,
              creditsAdded: result.creditsAdded,
            })
          }

          return { kind: 'processed' as const, alreadyProcessed: result.alreadyProcessed }
        }

        if (eventType === 'subscription.revoked' || eventType === 'subscription.canceled') {
          const profile = await cancelSubscriptionForProfile({ clerkUserId, email })

          await sendSubscriptionStatusEmail({
            to: profile.email,
            subject: 'Your Folia subscription was canceled',
            body: 'Your subscription status has been updated to canceled. Your remaining credits stay available.',
          })

          return { kind: 'canceled' as const }
        }

        return { kind: 'ignored' as const }
      },
    })

    if (eventResult.duplicate) {
      return Response.json({ ok: true, duplicate: true })
    }

    if (eventResult.result.kind === 'processed') {
      return Response.json({ ok: true, duplicate_payment: eventResult.result.alreadyProcessed || undefined })
    }

    if (eventResult.result.kind === 'canceled') {
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
