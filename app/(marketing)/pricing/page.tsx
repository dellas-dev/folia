import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

import { CheckoutButton } from '@/components/payments/checkout-button'
import { buttonVariants } from '@/components/ui/button-variants'
import { getMarketingLocale } from '@/lib/marketing/locale'
import { marketingCopy } from '@/lib/marketing/copy'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <section className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{copy.eyebrow}</p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{copy.pageTitle}</h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
          {copy.pageBody}
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
                  {currency === 'IDR' ? copy.idrLabel : copy.usdLabel}
                </CheckoutButton>
              ) : (
                <Link href="/sign-in" className={cn(buttonVariants({ size: 'lg' }), 'w-full justify-center')}>
                  {copy.buyLabel}
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-10 overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/90 shadow-sm shadow-black/5">
        <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-6 py-4">{copy.table.feature}</th>
              <th className="px-6 py-4">{copy.table.starter}</th>
              <th className="px-6 py-4">{copy.table.pro}</th>
              <th className="px-6 py-4">{copy.table.business}</th>
            </tr>
          </thead>
          <tbody>
            {copy.table.rows.map((row) => (
              <tr key={row[0]} className="border-t border-border/60">
                <td className="px-6 py-4 font-medium text-foreground">{row[0]}</td>
                <td className="px-6 py-4 text-muted-foreground">{row[1]}</td>
                <td className="px-6 py-4 text-muted-foreground">{row[2]}</td>
                <td className="px-6 py-4 text-muted-foreground">{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      <div className="mt-10 text-center text-sm text-muted-foreground">
        {copy.billingLabel} <Link href="/settings/billing" className="font-medium text-primary">{copy.billingLink}</Link>.
      </div>
    </div>
  )
}
