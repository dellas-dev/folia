import { Webhook } from 'standardwebhooks'

import type { Database } from '@/types/database.types'

type PaymentPlan = Database['public']['Tables']['purchases']['Row']['plan']

const POLAR_BASE_URL = process.env.POLAR_ACCESS_TOKEN?.startsWith('polar_sandbox')
  ? 'https://sandbox-api.polar.sh'
  : 'https://api.polar.sh'

export async function createPolarCheckoutSession({
  productId,
  customerName,
  customerEmail,
  externalCustomerId,
  metadata,
}: {
  productId: string
  customerName: string
  customerEmail: string
  externalCustomerId: string
  metadata: Record<string, string>
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const response = await fetch(`${POLAR_BASE_URL}/v1/checkouts/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      products: [productId],
      customer_name: customerName,
      customer_email: customerEmail,
      external_customer_id: externalCustomerId,
      success_url: `${appUrl}/settings/billing?success=1&checkout_id={CHECKOUT_ID}`,
      return_url: `${appUrl}/pricing`,
      metadata,
      locale: 'en-US',
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = await response.json() as { url?: string; id?: string }

  if (!data.url) {
    throw new Error('Polar did not return a checkout URL.')
  }

  return data
}

export async function verifyPolarWebhook(rawBody: string, headers: Headers) {
  const secret = process.env.POLAR_WEBHOOK_SECRET

  if (!secret) {
    throw new Error('POLAR_WEBHOOK_SECRET is not configured.')
  }

  const verifier = new Webhook(secret)
  return verifier.verify(rawBody, {
    'webhook-id': headers.get('webhook-id') ?? '',
    'webhook-timestamp': headers.get('webhook-timestamp') ?? '',
    'webhook-signature': headers.get('webhook-signature') ?? '',
  }) as {
    id?: string
    type?: string
    data?: Record<string, unknown>
  }
}

export function resolvePolarPlanFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  const plan = typeof metadata?.plan === 'string' ? metadata.plan : null

  if (plan === 'starter' || plan === 'pro' || plan === 'business' || plan === 'topup') {
    return plan as PaymentPlan
  }

  return null
}
