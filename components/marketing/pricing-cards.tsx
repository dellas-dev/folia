'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button-variants'
import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

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
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">{copy.eyebrow}</p>
        <h2 className="mt-2 text-4xl font-semibold text-foreground">{copy.title}</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-4">
        {pricingCards.map((plan) => (
          <article key={plan.key} className={cn('rounded-[1.8rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5', plan.key === 'pro' && 'border-primary/40 bg-primary/5')}>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{plan.label}</p>
            <h3 className="mt-4 text-4xl font-semibold text-foreground">
              Rp {PLANS[plan.key].price_idr.toLocaleString('id-ID')}
              {PLANS[plan.key].is_subscription ? '/mo' : ''}
            </h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{copy.cards[plan.key]}</p>
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 text-primary" />{PLANS[plan.key].credits} credits</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 text-primary" />{PLANS[plan.key].is_subscription ? copy.recurring : copy.oneTime}</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 text-primary" />{plan.key === 'starter' ? copy.starterFocus : plan.key === 'topup' ? copy.topupFocus : copy.powerFocus}</li>
            </ul>
          </article>
        ))}
      </div>
      <div className="text-center">
        <Link href="/pricing" className={cn(buttonVariants({ size: 'lg' }))}>
          {copy.compare}
        </Link>
      </div>
    </section>
  )
}
