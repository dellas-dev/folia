import { getCurrentProfile } from '@/lib/clerk/auth'
import { sendSubscriptionStatusEmail } from '@/lib/email/resend'
import { createMayarPaymentLink } from '@/lib/payments/mayar'
import { createPolarCheckoutSession } from '@/lib/payments/polar'

type CheckoutBody = {
  plan?: 'starter' | 'pro' | 'business' | 'topup'
  currency?: 'IDR' | 'USD'
}

export async function POST(request: Request) {
  const { user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as CheckoutBody

  if (!body.plan || !body.currency) {
    return Response.json({ error: 'plan and currency are required' }, { status: 422 })
  }

  try {
    if (body.currency === 'IDR') {
      const mayarProductIdMap = {
        starter: process.env.MAYAR_STARTER_PRODUCT_ID,
        pro: process.env.MAYAR_PRO_PRODUCT_ID,
        business: process.env.MAYAR_BUSINESS_PRODUCT_ID,
        topup: process.env.MAYAR_TOPUP_PRODUCT_ID,
      }

      if (!mayarProductIdMap[body.plan]) {
        return Response.json(
          { error: 'Mayar product is not configured for this plan.' },
          { status: 503 }
        )
      }

      const data = await createMayarPaymentLink({
        plan: body.plan,
        customerName: profile.full_name ?? user.fullName ?? 'Folia Customer',
        customerEmail: profile.email,
        clerkUserId: user.id,
      })

      return Response.json({
        provider: 'mayar',
        checkout_url: data.link,
      })
    }

    const productIdMap = {
      starter: process.env.POLAR_STARTER_PRODUCT_ID,
      pro: process.env.POLAR_PRO_PRODUCT_ID,
      business: process.env.POLAR_BUSINESS_PRODUCT_ID,
      topup: process.env.POLAR_TOPUP_PRODUCT_ID,
    }

    const productId = productIdMap[body.plan]

    if (!productId) {
      throw new Error('Polar product is not configured for this plan.')
    }

    const data = await createPolarCheckoutSession({
      productId,
      customerName: profile.full_name ?? user.fullName ?? 'Folia Customer',
      customerEmail: profile.email,
      externalCustomerId: user.id,
      metadata: {
        plan: body.plan,
        clerk_user_id: user.id,
        referred_by_code: profile.referred_by_code ?? '',
      },
    })

    await sendSubscriptionStatusEmail({
      to: profile.email,
      subject: 'Your Folia checkout is ready',
      body: 'We prepared your checkout session. Complete it to activate credits or subscription access.',
    })

    return Response.json({
      provider: 'polar',
      checkout_url: data.url,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session.' },
      { status: 500 }
    )
  }
}
