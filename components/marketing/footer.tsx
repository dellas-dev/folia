'use client'

import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

export function MarketingFooter() {
  return (
    <footer className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Folia</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Create faster. Publish cleaner. Grow your catalog.</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>
            Create account
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            View pricing
          </Link>
        </div>
      </div>
    </footer>
  )
}
