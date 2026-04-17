import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type AffiliateRow = Database['public']['Tables']['affiliates']['Row']
type AffiliateReferralRow = Database['public']['Tables']['affiliate_referrals']['Row']
type PurchasePlan = Database['public']['Tables']['purchases']['Row']['plan']

export type AffiliateReferralHistoryItem = AffiliateReferralRow & {
  referred_user_label: string
}

const AFFILIATE_REWARDS: Record<PurchasePlan, number> = {
  starter: 5,
  pro: 20,
  business: 40,
  topup: 0,
}

export function isAffiliateEligibleTier(tier: ProfileRow['tier']) {
  return tier === 'pro' || tier === 'business'
}

export function getAffiliateRewardForPlan(plan: PurchasePlan) {
  return AFFILIATE_REWARDS[plan]
}

export function buildAffiliateReferralUrl(code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = new URL('/api/affiliate/track', baseUrl)
  url.searchParams.set('code', code)
  url.searchParams.set('redirect', '/pricing')
  return url.toString()
}

export async function getAffiliateByCode(code: string) {
  const normalizedCode = normalizeAffiliateCode(code)

  if (!normalizedCode) {
    return null
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle()

  if (error) {
    throw new Error(`[affiliate] getAffiliateByCode failed (${error.code}): ${error.message}`)
  }

  return data
}

export async function getOrCreateAffiliate(profile: ProfileRow) {
  if (!isAffiliateEligibleTier(profile.tier)) {
    throw new Error('Affiliate access is only available for Pro and Business users.')
  }

  const supabase = createServerClient()
  const { data: existing, error: existingError } = await supabase
    .from('affiliates')
    .select('*')
    .eq('profile_id', profile.id)
    .maybeSingle()

  if (existingError) {
    throw new Error(`[affiliate] getOrCreateAffiliate lookup failed (${existingError.code}): ${existingError.message}`)
  }

  if (existing) {
    return existing
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from('affiliates')
      .insert({
        profile_id: profile.id,
        clerk_user_id: profile.clerk_user_id,
        code: generateAffiliateCode(),
        clicks: 0,
        conversions: 0,
        credits_earned: 0,
      })
      .select('*')
      .single()

    if (!error) {
      return data
    }

    if (error.code === '23505') {
      const { data: concurrent } = await supabase
        .from('affiliates')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (concurrent) {
        return concurrent
      }

      continue
    }

    throw new Error(`[affiliate] insert failed (${error.code}): ${error.message}`)
  }

  throw new Error('Unable to create affiliate code right now.')
}

export async function recordAffiliateClick(affiliate: AffiliateRow) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('affiliates')
    .update({ clicks: affiliate.clicks + 1 })
    .eq('id', affiliate.id)

  if (error) {
    throw new Error(`[affiliate] recordAffiliateClick failed (${error.code}): ${error.message}`)
  }
}

export async function getAffiliateReferrals(affiliateId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('affiliate_referrals')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(`[affiliate] getAffiliateReferrals failed (${error.code}): ${error.message}`)
  }

  const referredProfileIds = Array.from(new Set(data.map((item) => item.referred_profile_id).filter(Boolean))) as string[]
  const profileLabels = new Map<string, string>()

  if (referredProfileIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', referredProfileIds)

    if (profilesError) {
      throw new Error(`[affiliate] profiles lookup failed (${profilesError.code}): ${profilesError.message}`)
    }

    for (const profile of profiles) {
      profileLabels.set(profile.id, formatReferredUserLabel(profile.full_name, profile.email))
    }
  }

  return data.map((item) => ({
    ...item,
    referred_user_label: item.referred_profile_id
      ? profileLabels.get(item.referred_profile_id) ?? maskIdentifier(item.referred_profile_id)
      : 'Unknown user',
  })) satisfies AffiliateReferralHistoryItem[]
}

export function normalizeAffiliateCode(code: string | null | undefined) {
  return code?.trim().toUpperCase() ?? ''
}

function generateAffiliateCode() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
}

function formatReferredUserLabel(fullName: string | null, email: string | null) {
  if (fullName?.trim()) {
    return fullName.trim()
  }

  if (email) {
    return maskEmail(email)
  }

  return 'Unknown user'
}

function maskEmail(email: string) {
  const [localPart, domain = ''] = email.split('@')

  if (!localPart || !domain) {
    return maskIdentifier(email)
  }

  const visibleStart = localPart.slice(0, 2)
  return `${visibleStart}${'*'.repeat(Math.max(localPart.length - 2, 1))}@${domain}`
}

function maskIdentifier(value: string) {
  if (value.length <= 8) {
    return value
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`
}
