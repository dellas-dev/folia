'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'
import { STYLE_OPTIONS } from '@/types'

export function StyleShowcase({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].style
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">{copy.eyebrow}</p>
          <h2 className="mt-2 text-4xl font-semibold text-foreground">{copy.title}</h2>
        </div>
        <Link href="/community" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          {copy.link}
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STYLE_OPTIONS.map((style) => (
          <article key={style.id} className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-background">
            <div className="relative aspect-[4/3] w-full border-b border-border/70">
              <Image src={style.sampleImage} alt={style.label} fill className="object-cover" sizes="(max-width: 1280px) 50vw, 20vw" />
            </div>
            <div className="p-5">
              <p className="text-2xl">{style.icon}</p>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{style.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{style.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
