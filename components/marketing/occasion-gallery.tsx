'use client'

import Image from 'next/image'

import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'

const occasions = [
  'Wedding florals',
  'Birthday characters',
  'Christmas clipart',
  'Halloween icons',
  'Baby shower sets',
  'Minimalist branding shapes',
] as const

export function OccasionGallery({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].occasion
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <article className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">{copy.eyebrow}</p>
        <h2 className="mt-2 text-4xl font-semibold text-foreground">{copy.title}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {copy.items.map((occasion) => (
            <div key={occasion} className="rounded-2xl border border-border/70 bg-background px-4 py-4 text-sm font-medium text-foreground">
              {occasion}
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-[2rem] border border-border/70 bg-[linear-gradient(145deg,oklch(0.99_0.01_84),oklch(0.95_0.03_145))] p-8 shadow-sm shadow-black/5">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">{copy.mockupEyebrow}</p>
        <h2 className="mt-2 text-4xl font-semibold text-foreground">{copy.mockupTitle}</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {copy.mockupBody}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80">
            <div className="relative aspect-[4/3] w-full">
              <Image src="/samples/minimalist.jpg" alt="Invitation design example" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
            </div>
            <div className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{copy.before}</p>
              <p className="mt-2 text-sm text-foreground">{copy.beforeBody}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90">
            <div className="relative aspect-[4/3] w-full">
              <Image src="/samples/boho.jpg" alt="Styled listing mockup example" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
            </div>
            <div className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{copy.after}</p>
              <p className="mt-2 text-sm text-foreground">{copy.afterBody}</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
