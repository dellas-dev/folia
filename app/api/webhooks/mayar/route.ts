import { sendPurchaseConfirmationEmail, sendSubscriptionStatusEmail } from '@/lib/email/resend'
import { applyPaymentToProfile, cancelSubscriptionForProfile, processPaymentEventOnce } from '@/lib/payments/shared'
import { resolveMayarPlan, verifyMayarWebhook } from '@/lib/payments/mayar'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('X-Mayar-Signature')

  if (!verifyMayarWebhook(rawBody, signature)) {
    return Response.json({ error: 'Invalid webhook signature.' }, { status: 403 })
  }

  const payload = JSON.parse(rawBody) as {
    event?: { received?: string }
    data?: Record<string, unknown>
  }

  const eventType = payload.event?.received

  if (!eventType || !payload.data) {
    return Response.json({ error: 'Invalid webhook payload.' }, { status: 400 })
  }

  const eventId = typeof payload.data.id === 'string' ? payload.data.id : crypto.randomUUID()
  const eventResult = await processPaymentEventOnce({
    eventId,
    provider: 'mayar',
    type: eventType,
    handler: async () => {
      if (eventType === 'payment.received' || eventType === 'membership.newMemberRegistered' || eventType === 'membership.changeTierMemberRegistered') {
        const amount = typeof payload.data?.amount === 'number' ? payload.data.amount : null
        const productId = typeof payload.data?.productId === 'string' ? payload.data.productId : null
        const plan = resolveMayarPlan({ productId, amount })

        if (!plan) {
          return { kind: 'skipped' as const, reason: 'unknown_plan' as const }
        }

        const result = await applyPaymentToProfile({
          eventId,
          eventType,
          provider: 'mayar',
          email: typeof payload.data?.customerEmail === 'string' ? payload.data.customerEmail : null,
          plan,
          paymentId: typeof payload.data?.transactionId === 'string' ? payload.data.transactionId : eventId,
          currency: 'IDR',
          amountIdr: amount,
          customerId: typeof payload.data?.customerId === 'string' ? payload.data.customerId : null,
          subscriptionId: typeof payload.data?.membershipId === 'string' ? payload.data.membershipId : null,
          subscriptionPeriodEnd: typeof payload.data?.expiredAt === 'string' ? payload.data.expiredAt : null,
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

      if (eventType === 'membership.memberUnsubscribed' || eventType === 'membership.memberExpired') {
        const profile = await cancelSubscriptionForProfile({
          email: typeof payload.data?.customerEmail === 'string' ? payload.data.customerEmail : null,
        })

        await sendSubscriptionStatusEmail({
          to: profile.email,
          subject: 'Your Folia subscription was canceled',
          body: 'Your subscription has been marked as canceled. Any remaining credits stay available in your account.',
        })

        return { kind: 'canceled' as const }
      }

      return { kind: 'ignored' as const }
    },
  })

  if (eventResult.duplicate) {
    return Response.json({ ok: true, duplicate: true })
  }

  if (eventResult.result.kind === 'skipped') {
    return Response.json({ ok: true, skipped: eventResult.result.reason })
  }

  if (eventResult.result.kind === 'processed') {
    return Response.json({ ok: true, duplicate_payment: eventResult.result.alreadyProcessed || undefined })
  }

  if (eventResult.result.kind === 'canceled') {
    return Response.json({ ok: true })
  }

  return Response.json({ ok: true, ignored: true })
}
