import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

import { CheckoutButton } from '@/components/payments/checkout-button'
import { buttonVariants } from '@/components/ui/button-variants'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

const planDefinitions = [
  { key: 'starter', name: 'Starter', detail: '8 credits, 1024px output, 1 variation', highlight: false },
  { key: 'pro', name: 'Pro', detail: '40 credits, 2048px output, reference upload, mockups', highlight: true },
  { key: 'business', name: 'Business', detail: '80 credits, priority-ready shell, affiliate-ready', highlight: false },
  { key: 'topup', name: 'Top-up', detail: '8 credits for active customers who need more runs', highlight: false },
] as const

const featureRows = [
  ['Element Generator', 'Yes', 'Yes', 'Yes'],
  ['Mockup Generator', 'No', 'Yes', 'Yes'],
  ['Reference image upload', 'No', 'Yes', 'Yes'],
  ['Output resolution', '1024px', '2048px', '2048px'],
  ['Variations per run', '1', 'Up to 4', 'Up to 4'],
  ['Affiliate access', 'No', 'Yes', 'Yes'],
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <section className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Pricing</p>
        <h1 className="text-5xl font-semibold tracking-tight text-foreground">No free tier. Clean usage from day one.</h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
          Choose IDR for Indonesia checkout or USD for Polar international checkout. Mayar subscription verification may still be pending depending on your account status.
        </p>
        <div className="flex justify-center gap-2 pt-3">
          <Link href="/pricing?currency=IDR" className={cn(buttonVariants({ variant: currency === 'IDR' ? 'default' : 'outline', size: 'sm' }))}>IDR</Link>
          <Link href="/pricing?currency=USD" className={cn(buttonVariants({ variant: currency === 'USD' ? 'default' : 'outline', size: 'sm' }))}>USD</Link>
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-4">
        {planDefinitions.map((plan) => (
          <article key={plan.name} className={cn('rounded-[1.8rem] border border-border/70 bg-card/85 p-6 shadow-sm shadow-black/5', plan.highlight && 'border-primary/40 bg-primary/5')}>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{plan.name}</p>
            <h2 className="mt-4 text-4xl font-semibold text-foreground">
              {currency === 'IDR'
                ? `Rp ${PLANS[plan.key].price_idr.toLocaleString('id-ID')}${plan.key === 'pro' || plan.key === 'business' ? '/mo' : ''}`
                : `$${PLANS[plan.key].price_usd.toFixed(2)}${plan.key === 'pro' || plan.key === 'business' ? '/mo' : ''}`}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{plan.detail}</p>
            <div className="mt-6">
              {userId ? (
                <CheckoutButton plan={plan.key} currency={currency} className="w-full justify-center">
                  {currency === 'IDR' ? 'Checkout with Mayar' : 'Checkout with Polar'}
                </CheckoutButton>
              ) : (
                <Link href="/sign-in" className={cn(buttonVariants({ size: 'lg' }), 'w-full justify-center')}>
                  Sign in to buy
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/90 shadow-sm shadow-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-6 py-4">Feature</th>
              <th className="px-6 py-4">Starter</th>
              <th className="px-6 py-4">Pro</th>
              <th className="px-6 py-4">Business</th>
            </tr>
          </thead>
          <tbody>
            {featureRows.map((row) => (
              <tr key={row[0]} className="border-t border-border/60">
                <td className="px-6 py-4 font-medium text-foreground">{row[0]}</td>
                <td className="px-6 py-4 text-muted-foreground">{row[1]}</td>
                <td className="px-6 py-4 text-muted-foreground">{row[2]}</td>
                <td className="px-6 py-4 text-muted-foreground">{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-10 text-center text-sm text-muted-foreground">
        Need to manage an existing plan? <Link href="/settings/billing" className="font-medium text-primary">Open billing settings</Link>.
      </div>
    </div>
  )
}
