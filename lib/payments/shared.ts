import { createServerClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'
import type { Database } from '@/types/database.types'

type PaymentProvider = 'mayar' | 'polar'
type PaymentPlan = Database['public']['Tables']['purchases']['Row']['plan']

type ApplyPaymentInput = {
  eventId: string
  eventType: string
  provider: PaymentProvider
  clerkUserId?: string | null
  email?: string | null
  plan: PaymentPlan
  paymentId: string
  subscriptionId?: string | null
  subscriptionPeriodEnd?: string | null
  customerId?: string | null
  amountIdr?: number | null
  amountUsd?: number | null
  currency: 'IDR' | 'USD'
  paymentStatus?: 'pending' | 'success' | 'failed' | 'refunded'
}

type AppliedPaymentResult = {
  profile: Database['public']['Tables']['profiles']['Row']
  creditsAdded: number
  newCredits: number
  plan: PaymentPlan
  alreadyProcessed: boolean
}

async function getProfileByIdentity(clerkUserId?: string | null, email?: string | null) {
  const supabase = createServerClient()

  if (clerkUserId) {
    const { data } = await supabase.from('profiles').select('*').eq('clerk_user_id', clerkUserId).maybeSingle()
    if (data) return data
  }

  if (email) {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle()
    if (data) return data
  }

  return null
}

export async function recordPaymentEventIfNew(eventId: string, provider: PaymentProvider, type: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('payment_events').insert({
    id: eventId,
    provider,
    type,
    processed_at: new Date().toISOString(),
  })

  if (!error) {
    return true
  }

  if (error.code === '23505') {
    return false
  }

  throw error
}

export async function releasePaymentEvent(eventId: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('payment_events').delete().eq('id', eventId)

  if (error) {
    throw error
  }
}

export async function processPaymentEventOnce<T>({
  eventId,
  provider,
  type,
  handler,
}: {
  eventId: string
  provider: PaymentProvider
  type: string
  handler: () => Promise<T>
}) {
  const isNew = await recordPaymentEventIfNew(eventId, provider, type)

  if (!isNew) {
    return { duplicate: true as const }
  }

  try {
    const result = await handler()
    return { duplicate: false as const, result }
  } catch (error) {
    try {
      await releasePaymentEvent(eventId)
    } catch (releaseError) {
      console.error('[payments] Failed to release payment event lock', releaseError)
    }

    throw error
  }
}

async function findExistingPurchase({
  provider,
  paymentId,
  subscriptionId,
}: {
  provider: PaymentProvider
  paymentId: string
  subscriptionId?: string | null
}) {
  const supabase = createServerClient()

  const { data: paymentMatch, error: paymentError } = await supabase
    .from('purchases')
    .select('*')
    .eq('payment_provider', provider)
    .eq('payment_id', paymentId)
    .maybeSingle()

  if (paymentError) {
    throw paymentError
  }

  if (paymentMatch) {
    return paymentMatch
  }

  if (!subscriptionId) {
    return null
  }

  const { data: subscriptionMatch, error: subscriptionError } = await supabase
    .from('purchases')
    .select('*')
    .eq('payment_provider', provider)
    .eq('subscription_id', subscriptionId)
    .maybeSingle()

  if (subscriptionError) {
    throw subscriptionError
  }

  return subscriptionMatch
}

export async function applyPaymentToProfile(input: ApplyPaymentInput): Promise<AppliedPaymentResult> {
  const profile = await getProfileByIdentity(input.clerkUserId, input.email)

  if (!profile) {
    throw new Error('No matching profile found for payment event.')
  }

  const existingPurchase = await findExistingPurchase({
    provider: input.provider,
    paymentId: input.paymentId,
    subscriptionId: input.subscriptionId,
  })

  if (existingPurchase) {
    return {
      profile,
      creditsAdded: existingPurchase.credits_added,
      newCredits: profile.credits,
      plan: existingPurchase.plan,
      alreadyProcessed: true,
    }
  }

  const supabase = createServerClient()
  const creditsAdded = PLANS[input.plan].credits
  const isSubscription = PLANS[input.plan].is_subscription
  const nextTier = input.plan === 'topup' ? profile.tier : input.plan

  const profileUpdate: Database['public']['Tables']['profiles']['Update'] = {
    credits: profile.credits + creditsAdded,
    tier: nextTier,
  }

  if (isSubscription) {
    profileUpdate.subscription_status = input.paymentStatus === 'success' ? 'active' : profile.subscription_status
    profileUpdate.subscription_period_end = input.subscriptionPeriodEnd ?? profile.subscription_period_end
    profileUpdate.payment_provider = input.provider
    if (input.provider === 'mayar') {
      profileUpdate.mayar_customer_id = input.customerId ?? profile.mayar_customer_id
    }
    if (input.provider === 'polar') {
      profileUpdate.polar_customer_id = input.customerId ?? profile.polar_customer_id
    }
  }

  try {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', profile.id)

    if (profileError) {
      throw profileError
    }

    const purchaseInsert: Database['public']['Tables']['purchases']['Insert'] = {
      profile_id: profile.id,
      clerk_user_id: profile.clerk_user_id,
      plan: input.plan,
      credits_added: creditsAdded,
      amount_idr: input.amountIdr ?? null,
      amount_usd: input.amountUsd ?? null,
      currency: input.currency,
      payment_provider: input.provider,
      payment_id: input.paymentId,
      payment_status: input.paymentStatus ?? 'success',
      is_subscription: isSubscription,
      subscription_id: input.subscriptionId ?? null,
      referred_by_code: profile.referred_by_code,
    }

    const { error: purchaseError } = await supabase.from('purchases').insert(purchaseInsert)

    if (purchaseError) {
      throw purchaseError
    }
  } catch (error) {
    const rollbackUpdate: Database['public']['Tables']['profiles']['Update'] = {
      credits: profile.credits,
      tier: profile.tier,
      subscription_status: profile.subscription_status,
      subscription_period_end: profile.subscription_period_end,
      payment_provider: profile.payment_provider,
      mayar_customer_id: profile.mayar_customer_id,
      polar_customer_id: profile.polar_customer_id,
    }

    try {
      await supabase.from('profiles').update(rollbackUpdate).eq('id', profile.id)
    } catch (rollbackError) {
      console.error('[payments] Failed to rollback profile update', rollbackError)
    }

    throw error
  }

  return {
    profile,
    creditsAdded,
    newCredits: profile.credits + creditsAdded,
    plan: input.plan,
    alreadyProcessed: false,
  }
}

export async function cancelSubscriptionForProfile({
  clerkUserId,
  email,
}: {
  clerkUserId?: string | null
  email?: string | null
}) {
  const profile = await getProfileByIdentity(clerkUserId, email)

  if (!profile) {
    throw new Error('No matching profile found for cancellation event.')
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'canceled' })
    .eq('id', profile.id)

  if (error) {
    throw error
  }

  return profile
}
