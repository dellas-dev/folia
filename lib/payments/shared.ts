import { getAffiliateRewardForPlan, normalizeAffiliateCode } from '@/lib/affiliate'
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

async function getExistingPurchase(paymentId: string, provider: PaymentProvider) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('payment_id', paymentId)
    .eq('payment_provider', provider)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
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

async function awardAffiliateCredits({
  referredProfile,
  plan,
}: {
  referredProfile: Database['public']['Tables']['profiles']['Row']
  plan: PaymentPlan
}) {
  const referredByCode = normalizeAffiliateCode(referredProfile.referred_by_code)
  const creditsAwarded = getAffiliateRewardForPlan(plan)

  if (!referredByCode || creditsAwarded <= 0) {
    return null
  }

  const supabase = createServerClient()
  const { data, error } = await (supabase as typeof supabase & {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>
  }).rpc('award_affiliate_referral', {
    referred_by_code_input: referredByCode,
    referred_profile_id_input: referredProfile.id,
    plan_input: plan,
    credits_awarded_input: creditsAwarded,
  })

  if (error) {
    throw error
  }

  return data ? { creditsAwarded } : null
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

export async function applyPaymentToProfile(input: ApplyPaymentInput) {
  const existingPurchase = await getExistingPurchase(input.paymentId, input.provider)

  if (existingPurchase) {
    const profile = await getProfileByIdentity(input.clerkUserId, input.email)

    if (!profile) {
      throw new Error('No matching profile found for payment event.')
    }

    return {
      profile,
      creditsAdded: existingPurchase.credits_added,
      newCredits: profile.credits,
      plan: existingPurchase.plan,
    }
  }

  const profile = await getProfileByIdentity(input.clerkUserId, input.email)

  if (!profile) {
    throw new Error('No matching profile found for payment event.')
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

  try {
    await awardAffiliateCredits({
      referredProfile: profile,
      plan: input.plan,
    })
  } catch (error) {
    console.error('Failed to award affiliate credits:', error)
  }

  return {
    profile,
    creditsAdded,
    newCredits: profile.credits + creditsAdded,
    plan: input.plan,
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
