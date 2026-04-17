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
      <article className="rounded-[2.2rem] p-8 lg:p-10" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.06)' }}>
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: '#70787a' }}>{copy.eyebrow}</p>
        <h2 className="brand-display mt-2 text-4xl font-semibold sm:text-5xl" style={{ color: '#1a1c1c' }}>{copy.title}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {copy.items.map((occasion) => (
            <div key={occasion} className="rounded-[1.6rem] px-4 py-4" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>Use case</p>
              <p className="mt-2 text-sm font-medium" style={{ color: '#1a1c1c' }}>{occasion}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-[2.2rem] p-8 lg:p-10" style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.06)' }}>
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: '#70787a' }}>{copy.mockupEyebrow}</p>
        <h2 className="brand-display mt-2 text-4xl font-semibold sm:text-5xl" style={{ color: '#1a1c1c' }}>{copy.mockupTitle}</h2>
        <p className="mt-4 text-sm leading-7" style={{ color: '#70787a' }}>
          {copy.mockupBody}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="overflow-hidden rounded-[1.6rem]" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
            <div className="relative aspect-[4/3] w-full" style={{ backgroundColor: '#eeeeee' }}>
              <Image src="/samples/minimalist.jpg" alt="Invitation design example" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
              <div className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] backdrop-blur" style={{ backgroundColor: 'rgba(255,255,255,0.75)', color: '#70787a' }}>{copy.before}</div>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium" style={{ color: '#1a1c1c' }}>{copy.beforeBody}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-[1.6rem]" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
            <div className="relative aspect-[4/3] w-full" style={{ backgroundColor: '#d1e3e6' }}>
              <Image src="/samples/boho.jpg" alt="Styled listing mockup example" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
              <div className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] backdrop-blur font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.8)', color: '#37656b' }}>{copy.after}</div>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium" style={{ color: '#1a1c1c' }}>{copy.afterBody}</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
