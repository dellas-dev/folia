import Link from 'next/link'
import { Gift, TrendingUp, Users, Zap } from 'lucide-react'

import { ReferralLinkBox } from '@/components/app/affiliate/referral-link-box'
import { buildAffiliateReferralUrl, getAffiliateReferrals, getOrCreateAffiliate, isAffiliateEligibleTier } from '@/lib/affiliate'
import { requireCurrentProfile } from '@/lib/clerk/auth'

function formatReferralDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

const earningRules = [
  { plan: 'Starter',  reward: '5 credits',  badge: null },
  { plan: 'Pro',      reward: '20 credits', badge: '2× Multiplier' },
  { plan: 'Business', reward: '40 credits', badge: 'Priority Support' },
] as const

export default async function AffiliatePage() {
  const { profile } = await requireCurrentProfile()

  /* ── Upgrade wall ─────────────────────────────────────────── */
  if (!isAffiliateEligibleTier(profile.tier)) {
    return (
      <div className="pb-8">
        <div className="mb-6 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>Affiliate Program</p>
          <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}>
            Affiliate Dashboard
          </h1>
        </div>
        <div className="rounded-[1.5rem] p-7 space-y-5" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)' }}>
          <div
            className="flex size-14 items-center justify-center rounded-full"
            style={{ backgroundColor: '#d1e3e6' }}
          >
            <Gift className="size-6" style={{ color: '#37656b' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
              Unlock the Affiliate Program
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7" style={{ color: '#70787a' }}>
              Affiliate links are available for Pro and Business users. Earn credits whenever your referred users buy a paid plan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/settings/billing" className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}>
              Upgrade now
            </Link>
            <Link href="/settings/billing" className="inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold transition-colors hover:bg-[#eeeeee]" style={{ backgroundColor: '#f4f3f3', color: '#404849' }}>
              View plans
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const affiliate = await getOrCreateAffiliate(profile)
  const referralUrl = buildAffiliateReferralUrl(affiliate.code)
  const referrals = await getAffiliateReferrals(affiliate.id)

  const statCards = [
    { label: 'Total Clicks',            value: affiliate.clicks,          icon: TrendingUp, highlight: false },
    { label: 'Successful Conversions',  value: affiliate.conversions,     icon: Users,      highlight: false },
    { label: 'Credits Earned',          value: affiliate.credits_earned,  icon: Zap,        highlight: true  },
  ]

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>Affiliate Program</p>
        <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}>
          Spread the Folia Magic
        </h1>
      </div>

      {/* ── Referral link ────────────────────────────────────── */}
      <ReferralLinkBox code={affiliate.code} referralUrl={referralUrl} />

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <article
              key={card.label}
              className="rounded-[1.25rem] p-5"
              style={{
                backgroundColor: card.highlight ? '#1d3a3f' : '#ffffff',
                boxShadow: card.highlight
                  ? '0 4px 20px rgba(29,58,63,0.2)'
                  : '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.05)',
              }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: card.highlight ? 'rgba(255,255,255,0.5)' : '#70787a' }}
                >
                  {card.label}
                </p>
                <span
                  className="flex size-8 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: card.highlight ? 'rgba(255,255,255,0.1)' : '#d1e3e6',
                    color: card.highlight ? '#9fcfd5' : '#37656b',
                  }}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p
                className="mt-3 text-4xl font-bold tabular-nums"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: card.highlight ? '#ffffff' : '#1a1c1c',
                }}
              >
                {card.value.toLocaleString()}
              </p>
            </article>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Earning Rules ────────────────────────────────── */}
        <section
          className="rounded-[1.5rem] p-6"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)' }}
        >
          <h2 className="mb-4 text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
            Earning Rules
          </h2>
          <div className="space-y-0 overflow-hidden rounded-[1rem]" style={{ border: '1px solid rgba(192,200,201,0.2)' }}>
            <div
              className="grid grid-cols-[1fr_1fr_1fr] gap-4 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ backgroundColor: '#f4f3f3', color: '#70787a' }}
            >
              <span>Plan Referred</span>
              <span>One-time Reward</span>
              <span>Bonus</span>
            </div>
            {earningRules.map((rule, i) => (
              <div
                key={rule.plan}
                className="grid grid-cols-[1fr_1fr_1fr] gap-4 px-4 py-3.5 text-sm"
                style={{
                  backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa',
                  borderTop: '1px solid rgba(192,200,201,0.15)',
                }}
              >
                <span className="font-semibold" style={{ color: '#1a1c1c' }}>{rule.plan}</span>
                <span style={{ color: '#37656b', fontWeight: 600 }}>{rule.reward}</span>
                {rule.badge ? (
                  <span
                    className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ backgroundColor: '#f4ba9b', color: '#311302' }}
                  >
                    {rule.badge}
                  </span>
                ) : (
                  <span style={{ color: '#c0c8c9' }}>Standard</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent Referrals ─────────────────────────────── */}
        <section
          className="rounded-[1.5rem] p-6"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
              Recent Referrals
            </h2>
            <span className="text-xs" style={{ color: '#70787a' }}>Latest 20</span>
          </div>

          {referrals.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-[1rem] py-10 text-center"
              style={{ backgroundColor: '#f4f3f3' }}
            >
              <Gift className="size-8" style={{ color: '#c0c8c9' }} />
              <p className="text-sm" style={{ color: '#70787a' }}>
                No referrals yet. Share your link to start earning.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1rem]" style={{ border: '1px solid rgba(192,200,201,0.2)' }}>
              <div
                className="grid grid-cols-[1fr_1fr_0.6fr] gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ backgroundColor: '#f4f3f3', color: '#70787a' }}
              >
                <span>User</span>
                <span>Plan</span>
                <span>Earnings</span>
              </div>
              {referrals.map((referral, i) => (
                <div
                  key={referral.id}
                  className="grid grid-cols-[1fr_1fr_0.6fr] gap-3 px-4 py-3 text-xs"
                  style={{
                    backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa',
                    borderTop: '1px solid rgba(192,200,201,0.15)',
                    color: '#404849',
                  }}
                >
                  <span className="truncate font-medium">{referral.referred_user_label}</span>
                  <span className="capitalize">{referral.plan}</span>
                  <span className="font-bold" style={{ color: '#37656b' }}>+{referral.credits_awarded} cr</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── How it works ─────────────────────────────────────── */}
      <section
        className="rounded-[1.5rem] p-6"
        style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}
      >
        <h2 className="mb-4 text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
          Need help with your rewards?
        </h2>
        <p className="mb-4 max-w-xl text-sm leading-7" style={{ color: '#70787a' }}>
          Referral credits are applied automatically once your invitees confirm their subscription. For enterprise referrals, contact your account manager for bulk reward processing.
        </p>
        <Link
          href="/settings"
          className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
        >
          Contact Support
        </Link>
      </section>
    </div>
  )
}
