'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'
import { PLANS } from '@/lib/plans'

const pricingCards = [
  { key: 'starter', label: 'Starter', blurb: 'For quick single-run assets and simple shop experiments.' },
  { key: 'pro', label: 'Pro', blurb: 'For active creators who need more variations, mockups, and affiliate access.' },
  { key: 'business', label: 'Business', blurb: 'For higher-volume shops that want more credits and priority-ready setup.' },
  { key: 'topup', label: 'Top-up', blurb: 'For customers who already have a plan and need more credits fast.' },
] as const

export function PricingCards({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].pricing
  return (
    <section className="space-y-5">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: '#70787a' }}>{copy.eyebrow}</p>
        <h2 className="brand-display mt-2 text-4xl font-semibold sm:text-5xl" style={{ color: '#1a1c1c' }}>{copy.title}</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-4">
        {pricingCards.map((plan) => (
          <article
            key={plan.key}
            className="relative flex h-full flex-col rounded-[2rem] p-6"
            style={plan.key === 'pro'
              ? { backgroundColor: '#1d3a3f', boxShadow: '0 20px 50px -20px rgba(29,58,63,0.35)' }
              : { backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.04)' }
            }
          >
            {plan.key === 'pro' ? (
              <span className="absolute right-5 top-5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]" style={{ backgroundColor: '#f4ba9b', color: '#311302' }}>
                Most popular
              </span>
            ) : null}
            <p className="text-sm uppercase tracking-[0.24em]" style={{ color: plan.key === 'pro' ? 'rgba(255,255,255,0.5)' : '#70787a' }}>{plan.label}</p>
            <h3 className="mt-4 text-4xl font-semibold" style={{ color: plan.key === 'pro' ? '#ffffff' : '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
              Rp {PLANS[plan.key].price_idr.toLocaleString('id-ID')}
              {PLANS[plan.key].is_subscription ? '/mo' : ''}
            </h3>
            <p className="mt-4 text-sm leading-7" style={{ color: plan.key === 'pro' ? 'rgba(255,255,255,0.65)' : '#70787a' }}>{copy.cards[plan.key]}</p>
            <ul className="mt-6 space-y-3 pt-6 text-sm" style={{ color: plan.key === 'pro' ? 'rgba(255,255,255,0.8)' : '#404849' }}>
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 shrink-0" style={{ color: plan.key === 'pro' ? '#9fcfd5' : '#37656b' }} />{PLANS[plan.key].credits} credits</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 shrink-0" style={{ color: plan.key === 'pro' ? '#9fcfd5' : '#37656b' }} />{PLANS[plan.key].is_subscription ? copy.recurring : copy.oneTime}</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 shrink-0" style={{ color: plan.key === 'pro' ? '#9fcfd5' : '#37656b' }} />{plan.key === 'starter' ? copy.starterFocus : plan.key === 'topup' ? copy.topupFocus : copy.powerFocus}</li>
            </ul>
            <div className="mt-6 pt-2">
              <Link
                href="/pricing"
                className="flex h-10 w-full items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-90"
                style={plan.key === 'pro'
                  ? { backgroundColor: '#37656b', color: '#ffffff' }
                  : { backgroundColor: '#eeeeee', color: '#404849' }
                }
              >
                {plan.key === 'topup' ? 'See top-up options' : 'Choose this plan'}
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div className="text-center">
        <Link
          href="/pricing"
          className="inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 14px rgba(55,101,107,0.25)' }}
        >
          {copy.compare}
        </Link>
      </div>
    </section>
  )
}
