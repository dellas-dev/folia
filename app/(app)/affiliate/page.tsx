import Link from 'next/link'

import { ReferralLinkBox } from '@/components/app/affiliate/referral-link-box'
import { buttonVariants } from '@/components/ui/button-variants'
import { buildAffiliateReferralUrl, getAffiliateReferrals, getOrCreateAffiliate, isAffiliateEligibleTier } from '@/lib/affiliate'
import { requireCurrentProfile } from '@/lib/clerk/auth'
import { cn } from '@/lib/utils'

const stats = [
  { key: 'clicks', label: 'Clicks' },
  { key: 'conversions', label: 'Conversions' },
  { key: 'credits_earned', label: 'Credits earned' },
] as const

function formatReferralDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default async function AffiliatePage() {
  const { profile } = await requireCurrentProfile()

  if (!isAffiliateEligibleTier(profile.tier)) {
    return (
      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Affiliate</p>
        <h1 className="mt-2 text-4xl font-semibold text-foreground sm:text-5xl">Unlock referrals on Pro or Business.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Affiliate links are available for Pro and Business users. Upgrade to share your referral link and earn credits when referred users buy a paid plan.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/settings/billing" className={cn(buttonVariants({ size: 'lg' }))}>
            Upgrade now
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            View plans
          </Link>
        </div>
      </section>
    )
  }

  const affiliate = await getOrCreateAffiliate(profile)
  const referralUrl = buildAffiliateReferralUrl(affiliate.code)
  const referrals = await getAffiliateReferrals(affiliate.id)

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Affiliate</p>
        <h1 className="mt-2 text-4xl font-semibold text-foreground sm:text-5xl">Share your link and earn credits.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          When someone signs up through your referral link and buys a paid plan, Folia stores the referral and your stats update here.
        </p>
        <div className="mt-8">
          <ReferralLinkBox code={affiliate.code} referralUrl={referralUrl} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {stats.map((item) => (
          <article key={item.key} className="rounded-[1.6rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
            <h2 className="mt-3 text-4xl font-semibold text-foreground">{affiliate[item.key]}</h2>
          </article>
        ))}
      </section>

      <section className="rounded-[1.8rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5">
        <h2 className="text-2xl font-semibold text-foreground">How it works</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
          <p>Starter purchase: earn 5 credits.</p>
          <p>Pro subscription: earn 20 credits.</p>
          <p>Business subscription: earn 40 credits.</p>
          <p>Your referral cookie lasts for 30 days after a tracked click.</p>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Recent referrals</h2>
          <p className="text-sm text-muted-foreground">Latest 20 rewards</p>
        </div>

        {referrals.length === 0 ? (
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            No referral rewards yet. Share your link to start collecting clicks and paid conversions.
          </p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-border/70">
            <div className="grid grid-cols-[1.2fr,1fr,0.8fr,0.8fr] gap-4 border-b border-border/70 bg-background px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>Date</span>
              <span>User</span>
              <span>Plan</span>
              <span>Reward</span>
            </div>
            <div className="divide-y divide-border/70 bg-card">
              {referrals.map((referral) => (
                <div key={referral.id} className="grid grid-cols-[1.2fr,1fr,0.8fr,0.8fr] gap-4 px-4 py-3 text-sm text-foreground">
                  <span>{formatReferralDate(referral.created_at)}</span>
                  <span className="truncate">{referral.referred_user_label}</span>
                  <span className="capitalize">{referral.plan}</span>
                  <span>{referral.credits_awarded} credits</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
