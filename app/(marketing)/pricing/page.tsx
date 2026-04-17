import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Check } from 'lucide-react'

import { CheckoutButton } from '@/components/payments/checkout-button'
import { getMarketingLocale } from '@/lib/marketing/locale'
import { marketingCopy } from '@/lib/marketing/copy'
import { PLANS } from '@/lib/plans'

const planDefinitions = [
  { key: 'starter', name: 'Starter', detail: '8 credits, 1024px output, 1 variation', highlight: false },
  { key: 'pro', name: 'Pro', detail: '40 credits, 2048px output, reference upload, mockups', highlight: true },
  { key: 'business', name: 'Business', detail: '80 credits, priority-ready shell, affiliate-ready', highlight: false },
  { key: 'topup', name: 'Top-up', detail: '8 credits for active customers who need more runs', highlight: false },
] as const

export const metadata: Metadata = {
  title: 'Pricing | Folia',
  description:
    'Compare Folia plans for clipart generation, mockup creation, affiliate access, and paid checkout in IDR or USD.',
}

type PricingPageProps = {
  searchParams: Promise<{ currency?: 'IDR' | 'USD' }>
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams
  const currency = params.currency === 'USD' ? 'USD' : 'IDR'
  const { userId } = await auth()
  const locale = await getMarketingLocale()
  const copy = marketingCopy[locale].pricing
  const summaryItems = [
    'No free tier, cleaner commercial usage from day one',
    'Clipart generation for digital sellers and invitation creators',
    'Mockups, reference uploads, and affiliate tools on growth plans',
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
      <section className="relative overflow-hidden rounded-[2.5rem] p-8 text-center lg:p-14" style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.07)' }}>
        <div className="absolute inset-x-0 top-0 h-48" style={{ background: 'radial-gradient(circle at top left, rgba(55,101,107,0.07), transparent 46%), radial-gradient(circle at top right, rgba(80,126,132,0.04), transparent 26%)' }} />
        <div className="relative space-y-6">
          <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#70787a' }}>{copy.eyebrow}</p>
          <h1 className="brand-display mx-auto max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-[4.5rem]" style={{ color: '#1a1c1c' }}>
            Start small, then scale into mockups and higher-volume output.
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-8" style={{ color: '#70787a' }}>
            {copy.pageBody}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            {(['IDR', 'USD'] as const).map((cur) => (
              <Link
                key={cur}
                href={`/pricing?currency=${cur}`}
                className="rounded-full px-5 py-2 text-sm font-bold transition-colors"
                style={currency === cur
                  ? { backgroundColor: '#37656b', color: '#ffffff' }
                  : { backgroundColor: '#eeeeee', color: '#404849' }
                }
              >
                {cur}
              </Link>
            ))}
          </div>
          <div className="grid gap-3 pt-4 lg:grid-cols-3">
            {summaryItems.map((item) => (
              <div key={item} className="rounded-[1.6rem] px-4 py-4 text-left" style={{ backgroundColor: '#f4f3f3' }}>
                <p className="text-sm font-medium" style={{ color: '#1a1c1c' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-4">
        {planDefinitions.map((plan) => (
          <article
            key={plan.name}
            className="relative flex h-full flex-col rounded-[2.4rem] p-8 transition-all"
            style={plan.highlight
              ? { backgroundColor: '#1d3a3f', boxShadow: '0 18px 50px -18px rgba(29,58,63,0.35)' }
              : { backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.04)' }
            }
          >
            {plan.highlight ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: '#f4ba9b', color: '#311302' }}>
                Most popular
              </span>
            ) : null}
            <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: plan.highlight ? 'rgba(255,255,255,0.5)' : '#70787a' }}>{plan.name}</p>
            <h2 className="mt-5 text-4xl font-semibold" style={{ color: plan.highlight ? '#ffffff' : '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
              {currency === 'IDR'
                ? `Rp ${PLANS[plan.key].price_idr.toLocaleString('id-ID')}${plan.key === 'pro' || plan.key === 'business' ? '/mo' : ''}`
                : `$${PLANS[plan.key].price_usd.toFixed(2)}${plan.key === 'pro' || plan.key === 'business' ? '/mo' : ''}`}
            </h2>
            <p className="mt-4 min-h-[48px] text-xs leading-7" style={{ color: plan.highlight ? 'rgba(255,255,255,0.55)' : '#70787a' }}>{plan.detail}</p>

            <div className="mt-8 flex-1 space-y-4 text-sm">
              {[
                `${PLANS[plan.key].credits} credits`,
                plan.key === 'pro' || plan.key === 'business' ? 'Recurring access' : 'One-time purchase',
                plan.key === 'starter'
                  ? 'Element generation focus'
                  : plan.key === 'topup'
                    ? 'Extra runs for active users'
                    : 'Mockups and advanced workflow',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="flex size-5 items-center justify-center rounded-full" style={{ backgroundColor: plan.highlight ? 'rgba(55,101,107,0.4)' : '#d1e3e6', color: plan.highlight ? '#9fcfd5' : '#37656b' }}>
                    <Check className="size-3" />
                  </span>
                  <span className="text-xs" style={{ color: plan.highlight ? 'rgba(255,255,255,0.8)' : '#404849' }}>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              {userId ? (
                <CheckoutButton plan={plan.key} currency={currency} className="w-full justify-center rounded-full">
                  {currency === 'IDR' ? copy.idrLabel : copy.usdLabel}
                </CheckoutButton>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex h-11 w-full items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-90"
                  style={plan.highlight
                    ? { backgroundColor: '#37656b', color: '#ffffff' }
                    : { backgroundColor: '#eeeeee', color: '#404849' }
                  }
                >
                  {plan.key === 'topup' ? 'See top-up options' : 'Choose this plan'}
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-[2rem]" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-[680px] w-full text-left text-sm">
            <thead style={{ backgroundColor: '#f4f3f3', color: '#70787a' }}>
              <tr>
                <th className="px-6 py-4">{copy.table.feature}</th>
                <th className="px-6 py-4">{copy.table.starter}</th>
                <th className="px-6 py-4">{copy.table.pro}</th>
                <th className="px-6 py-4">{copy.table.business}</th>
              </tr>
            </thead>
            <tbody>
              {copy.table.rows.map((row, i) => (
                <tr key={row[0]} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa', borderTop: '1px solid rgba(192,200,201,0.15)' }}>
                  <td className="px-6 py-4 font-medium" style={{ color: '#1a1c1c' }}>{row[0]}</td>
                  <td className="px-6 py-4" style={{ color: '#70787a' }}>{row[1]}</td>
                  <td className="px-6 py-4 font-semibold" style={{ color: '#37656b' }}>{row[2]}</td>
                  <td className="px-6 py-4" style={{ color: '#70787a' }}>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 rounded-[1.8rem] px-6 py-5 text-center text-sm" style={{ backgroundColor: '#f4f3f3', color: '#70787a', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
        {copy.billingLabel} <Link href="/settings/billing" className="font-medium" style={{ color: '#37656b' }}>{copy.billingLink}</Link>.
      </div>
    </div>
  )
}
