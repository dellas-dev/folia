'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'
import { STYLE_OPTIONS } from '@/types'

export function StyleShowcase({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].style
  return (
    <section className="rounded-[2.2rem] p-8 lg:p-10" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.06)' }}>
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
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STYLE_OPTIONS.map((style) => (
          <article key={style.id} className="group overflow-hidden rounded-[1.8rem] transition-transform duration-200 hover:-translate-y-1" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.04)' }}>
            <div className="relative aspect-[4/3] w-full bg-[linear-gradient(145deg,rgba(253,250,245,0.9),rgba(231,223,207,0.75))]">
              <Image src={style.sampleImage} alt={style.label} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" sizes="(max-width: 1280px) 50vw, 20vw" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] backdrop-blur" style={{ backgroundColor: 'rgba(255,255,255,0.75)', color: '#70787a' }}>Style</span>
                <span className="text-2xl drop-shadow-sm">{style.icon}</span>
              </div>
              <div className="absolute inset-x-4 bottom-4 rounded-2xl p-3 backdrop-blur" style={{ backgroundColor: 'rgba(255,255,255,0.72)' }}>
                <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>Best for</p>
                <p className="mt-1 text-sm font-medium" style={{ color: '#1a1c1c' }}>{style.description}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: '#70787a' }}>Curated direction</p>
              <h3 className="mt-3 text-lg font-semibold" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>{style.label}</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: '#70787a' }}>Designed to keep your outputs visually consistent without changing tools or breaking your workflow.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
