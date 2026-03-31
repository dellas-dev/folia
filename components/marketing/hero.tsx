'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button-variants'
import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'
import { cn } from '@/lib/utils'

const heroExamples = [
  {
    title: 'Watercolor florals for wedding invitations',
    image: '/samples/watercolor.jpg',
  },
  {
    title: 'Kawaii animals for kids birthday printables',
    image: '/samples/cartoon.jpg',
  },
  {
    title: 'Boho botanical elements for rustic templates',
    image: '/samples/boho.jpg',
  },
] as const

type HeroProps = {
  locale: MarketingLocale
}

export function Hero({ locale }: HeroProps) {
  const copy = marketingCopy[locale].hero
  return (
    <section className="grid gap-8 rounded-[2rem] border border-border/60 bg-card/85 p-8 shadow-lg shadow-black/5 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm text-accent-foreground">
          <Sparkles className="size-4" />
          {copy.badge}
        </div>
        <div className="space-y-4">
          <h1 className="max-w-3xl text-5xl font-semibold leading-none tracking-tight text-foreground sm:text-6xl">
            {copy.title}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {copy.body}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>
            {copy.ctaPrimary}
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            {copy.ctaSecondary}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.75rem] bg-[linear-gradient(180deg,oklch(0.98_0.01_84),oklch(0.94_0.03_145))] p-6">
        {heroExamples.map((example, index) => (
          <div key={example.image} className={cn('overflow-hidden rounded-3xl border border-white/60 shadow-sm', index === 0 ? 'bg-white/75' : 'bg-white/60')}>
            <div className="relative aspect-[16/10] w-full">
              <Image src={example.image} alt={copy.examples[index]} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 420px" />
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{copy.exampleLabel}</p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{copy.examples[index]}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {copy.exampleBody}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
