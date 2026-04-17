import Link from 'next/link'
import { CreditCard, Sparkles, TrendingUp } from 'lucide-react'

import { CheckoutButton } from '@/components/payments/checkout-button'
import { requireCurrentProfile } from '@/lib/clerk/auth'

const plans = [
  {
    name: 'Starter',
    credits: '50 Credits',
    highlight: false,
  },
  {
    name: 'Pro',
    credits: '250 Credits',
    highlight: true,
  },
  {
    name: 'Business',
    credits: 'Unlimited*',
    highlight: false,
  },
] as const

const planFeatures = [
  { label: 'Monthly Credits',      starter: '50 Credits',      pro: '250 Credits',    business: 'Unlimited*' },
  { label: 'AI Generation Quality', starter: 'Standard',       pro: 'HD Precision',   business: '4K Ultra HD' },
  { label: 'Background Removal',   starter: 'Basic',           pro: 'Advanced Edge',  business: 'Advanced Edge' },
  { label: 'Export Formats',       starter: 'PNG, JPG',        pro: 'SVG, PNG, JPG',  business: 'All Formats' },
  { label: 'Priority Support',     starter: '—',               pro: 'Email Support',  business: '24/7 Dedicated' },
] as const

export default async function BillingPage() {
  const { profile } = await requireCurrentProfile()

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>Settings</p>
        <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}>
          Billing &amp; Credits
        </h1>
      </div>

      {/* ── Status cards ─────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Current Tier', value: profile.tier, badge: null },
          { label: 'Credits',      value: profile.credits.toLocaleString(), badge: null },
          { label: 'Status',       value: profile.subscription_status, badge: profile.subscription_status === 'active' ? 'active' : null },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[1.25rem] p-5"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.05)',
              border: '1px solid rgba(192,200,201,0.1)',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
              {item.label}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-2xl font-bold capitalize" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
                {item.value}
              </p>
              {item.badge === 'active' && (
                <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#37656b' }} />
              )}
            </div>
            {item.label === 'Current Tier' ? (
              <p className="mt-4 text-xs font-medium" style={{ color: '#404849' }}>Billing-ready workspace</p>
            ) : null}
            {item.label === 'Credits' ? (
              <div className="mt-4 h-1.5 w-full rounded-full" style={{ backgroundColor: '#eeeeee' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${Math.min(profile.credits, 100)}%`, backgroundColor: '#37656b' }} />
              </div>
            ) : null}
            {item.label === 'Status' ? (
              <p className="mt-4 text-xs font-medium underline underline-offset-4" style={{ color: '#404849' }}>
                Manage Subscription
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {/* ── Top-up sections ──────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Indonesia */}
        <article
          className="rounded-[1.5rem] p-6"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)' }}
        >
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
              Top-up Indonesia
            </h2>
          </div>
          <p className="mb-5 text-xs" style={{ color: '#70787a' }}>
            Payment via Mayar (QRIS, Bank Transfer)
          </p>
          <div className="space-y-2.5">
            {[
              { label: '50 Credits',  price: 'Rp 75.000' },
              { label: '200 Credits', price: 'Rp 250.000' },
              { label: '500 Credits', price: 'Rp 500.000' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-full px-5 py-3 font-bold transition-colors hover:border-[#37656b]"
                style={{ border: '2px solid rgba(55,101,107,0.15)', color: '#37656b' }}
              >
                <span className="text-sm" style={{ color: '#1a1c1c' }}>{item.label}</span>
                <span className="rounded-full px-4 py-1 text-sm" style={{ backgroundColor: 'rgba(55,101,107,0.05)' }}>{item.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <CheckoutButton plan="starter" currency="IDR">Buy Starter</CheckoutButton>
            <CheckoutButton plan="topup" currency="IDR">Buy Top-up</CheckoutButton>
          </div>
        </article>

        {/* International */}
        <article
          className="rounded-[1.5rem] p-6"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)' }}
        >
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
              International Top-up
            </h2>
          </div>
          <p className="mb-5 text-xs" style={{ color: '#70787a' }}>
            Payment via Polar (Stripe, Global Cards)
          </p>
          <div className="space-y-2.5">
            {[
              { label: '50 Credits',  price: '$5.00' },
              { label: '200 Credits', price: '$18.00' },
              { label: '500 Credits', price: '$40.00' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-full px-5 py-3 font-bold transition-colors hover:border-[#37656b]"
                style={{ border: '2px solid rgba(55,101,107,0.15)', color: '#37656b' }}
              >
                <span className="text-sm" style={{ color: '#1a1c1c' }}>{item.label}</span>
                <span className="rounded-full px-4 py-1 text-sm" style={{ backgroundColor: 'rgba(55,101,107,0.05)' }}>{item.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <CheckoutButton plan="pro" currency="USD">Upgrade to Pro</CheckoutButton>
            <CheckoutButton plan="business" currency="USD">Upgrade to Business</CheckoutButton>
            <CheckoutButton plan="topup" currency="USD">Buy Top-up</CheckoutButton>
          </div>
        </article>
      </div>

      {/* ── Compare Plans ────────────────────────────────────── */}
      <section
        className="rounded-[1.5rem] p-6"
        style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)' }}
      >
        <h2 className="mb-5 text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
          Compare Plans
        </h2>
        <div className="overflow-hidden rounded-[1rem]" style={{ border: '1px solid rgba(192,200,201,0.2)' }}>
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="px-4 py-3" style={{ backgroundColor: '#f4f3f3' }}>
              <span className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#70787a' }}>Features</span>
            </div>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="px-4 py-3 text-center"
                style={{ backgroundColor: plan.highlight ? '#37656b' : '#f4f3f3' }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: plan.highlight ? '#ffffff' : '#1a1c1c' }}
                >
                  {plan.name}
                </span>
              </div>
            ))}
          </div>
          {/* Rows */}
          {planFeatures.map((feature, i) => (
            <div
              key={feature.label}
              className="grid grid-cols-[1.5fr_1fr_1fr_1fr]"
              style={{ borderTop: '1px solid rgba(192,200,201,0.15)', backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}
            >
              <div className="px-4 py-3">
                <span className="text-xs font-medium" style={{ color: '#404849' }}>{feature.label}</span>
              </div>
              <div className="px-4 py-3 text-center">
                <span className="text-xs" style={{ color: '#70787a' }}>{feature.starter}</span>
              </div>
              <div className="px-4 py-3 text-center">
                <span className="text-xs font-semibold" style={{ color: '#37656b' }}>{feature.pro}</span>
              </div>
              <div className="px-4 py-3 text-center">
                <span className="text-xs" style={{ color: '#70787a' }}>{feature.business}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subscription management ──────────────────────────── */}
      <section
        className="rounded-[1.5rem] p-6"
        style={{ backgroundColor: '#f4f3f3' }}
      >
        <div className="flex items-start gap-4">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: '#d1e3e6' }}
          >
            <Sparkles className="size-5" style={{ color: '#37656b' }} />
          </span>
          <div>
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
              Subscription Management
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: '#70787a' }}>
              For plan changes or cancellations, start a new checkout or contact support for manual adjustments.
            </p>
            <Link
              href="/settings"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors hover:bg-[#eeeeee]"
              style={{ backgroundColor: '#ffffff', color: '#404849' }}
            >
              <CreditCard className="size-4" />
              Manage subscription
            </Link>
          </div>
        </div>
      </section>

      {/* ── Credit History (placeholder) ─────────────────────── */}
      <section
        className="rounded-[1.5rem] p-6"
        style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}>
            Credit History
          </h2>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: '#37656b' }}
          >
            <TrendingUp className="size-3.5" />
            Download Statement
          </button>
        </div>
        <div className="overflow-hidden rounded-[1rem]" style={{ border: '1px solid rgba(192,200,201,0.2)' }}>
          <div
            className="grid grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr] gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ backgroundColor: '#f4f3f3', color: '#70787a' }}
          >
            <span>Date</span><span>Action</span><span>Change</span><span>Balance</span>
          </div>
          <div
            className="flex items-center justify-center py-8"
            style={{ color: '#c0c8c9' }}
          >
            <p className="text-sm">No credit history yet.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
