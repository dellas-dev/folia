'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { STYLE_OPTIONS } from '@/types'

export function CommunityPreview() {
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Community</p>
          <h2 className="mt-2 text-4xl font-semibold text-foreground">Preview what creators are already making.</h2>
        </div>
        <Link href="/community" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          Open community gallery
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STYLE_OPTIONS.slice(0, 3).map((style) => (
          <article key={style.id} className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-background">
            <div className="relative aspect-[4/3] w-full border-b border-border/70">
              <Image src={style.sampleImage} alt={`${style.label} preview`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 360px" />
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{style.label}</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Explore public generations in this style and see how different shops approach occasions, bundles, and listing visuals.
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
