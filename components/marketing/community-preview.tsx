'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'
import { STYLE_OPTIONS } from '@/types'

export function CommunityPreview({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].community
  return (
    <section className="rounded-[2.2rem] p-8 lg:p-10" style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.06)' }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em]" style={{ color: '#70787a' }}>{copy.eyebrow}</p>
          <h2 className="brand-display mt-2 text-4xl font-semibold sm:text-5xl" style={{ color: '#1a1c1c' }}>{copy.title}</h2>
        </div>
        <Link href="/community" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#37656b' }}>
          {copy.link}
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STYLE_OPTIONS.slice(0, 3).map((style, index) => (
          <article key={style.id} className="overflow-hidden rounded-[1.8rem]" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
            <div className="relative aspect-[4/3] w-full" style={{ backgroundColor: '#eeeeee' }}>
              <Image src={style.sampleImage} alt={`${style.label} preview`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 360px" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                <span className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] backdrop-blur" style={{ backgroundColor: 'rgba(255,255,255,0.8)', color: '#70787a' }}>Featured</span>
                <span className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.9)' }}>0{index + 1}</span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>{style.label}</p>
              <p className="mt-2 text-sm font-medium" style={{ color: '#1a1c1c' }}>Public showcase card ready for storefront inspiration.</p>
              <p className="mt-3 text-sm leading-7" style={{ color: '#70787a' }}>
                {copy.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
