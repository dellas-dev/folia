import { getOrCreateAffiliate, buildAffiliateReferralUrl, isAffiliateEligibleTier } from '@/lib/affiliate'
import { requireCurrentProfile } from '@/lib/clerk/auth'

export async function POST() {
  const { profile } = await requireCurrentProfile()

  if (!isAffiliateEligibleTier(profile.tier)) {
    return Response.json({ error: 'Affiliate access is available for Pro and Business only.' }, { status: 403 })
  }

  const affiliate = await getOrCreateAffiliate(profile)

  return Response.json({
    code: affiliate.code,
    referral_url: buildAffiliateReferralUrl(affiliate.code),
    stats: {
      clicks: affiliate.clicks,
      conversions: affiliate.conversions,
      credits_earned: affiliate.credits_earned,
    },
  })
}
