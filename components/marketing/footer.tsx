'use client'

import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button-variants'
import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'
import { cn } from '@/lib/utils'

export function MarketingFooter({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].footer
  return (
    <footer className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">{copy.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">{copy.title}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>
            {copy.primary}
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            {copy.secondary}
          </Link>
        </div>
      </div>
    </footer>
  )
}
