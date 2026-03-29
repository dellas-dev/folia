import crypto from 'node:crypto'

import { PLANS } from '@/lib/plans'
import type { Database } from '@/types/database.types'

type PaymentPlan = Database['public']['Tables']['purchases']['Row']['plan']

const MAYAR_BASE_URL = process.env.MAYAR_API_KEY?.includes('sandbox')
  ? 'https://api.mayar.club'
  : 'https://api.mayar.id'

export function verifyMayarWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.MAYAR_WEBHOOK_SECRET

  if (!secret || !signature) {
    return false
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function createMayarPaymentLink({
  plan,
  customerName,
  customerEmail,
  customerPhone,
  clerkUserId,
}: {
  plan: PaymentPlan
  customerName: string
  customerEmail: string
  customerPhone?: string
  clerkUserId: string
}) {
  const amount = PLANS[plan].price_idr
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const description = `Folia ${plan} purchase for ${clerkUserId}`

  const response = await fetch(`${MAYAR_BASE_URL}/hl/v1/payment/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MAYAR_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: customerName,
      email: customerEmail,
      amount,
      mobile: customerPhone ?? '0000000000',
      redirectURL: `${appUrl}/settings/billing`,
      description,
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = await response.json() as {
    data?: {
      id?: string
      transactionId?: string
      link?: string
    }
  }

  if (!data.data?.link) {
    throw new Error('Mayar did not return a checkout link.')
  }

  return data.data
}

export function resolveMayarPlan({ productId, amount }: { productId?: string | null; amount?: number | null }) {
  const byProductId = new Map<string, PaymentPlan>()

  if (process.env.MAYAR_STARTER_PRODUCT_ID) byProductId.set(process.env.MAYAR_STARTER_PRODUCT_ID, 'starter')
  if (process.env.MAYAR_PRO_PRODUCT_ID) byProductId.set(process.env.MAYAR_PRO_PRODUCT_ID, 'pro')
  if (process.env.MAYAR_BUSINESS_PRODUCT_ID) byProductId.set(process.env.MAYAR_BUSINESS_PRODUCT_ID, 'business')
  if (process.env.MAYAR_TOPUP_PRODUCT_ID) byProductId.set(process.env.MAYAR_TOPUP_PRODUCT_ID, 'topup')

  if (productId && byProductId.has(productId)) {
    return byProductId.get(productId) ?? null
  }

  if (amount === PLANS.starter.price_idr) return 'starter'
  if (amount === PLANS.pro.price_idr) return 'pro'
  if (amount === PLANS.business.price_idr) return 'business'
  if (amount === PLANS.topup.price_idr) return 'topup'

  return null
}
