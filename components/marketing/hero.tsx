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
    <section className="relative overflow-hidden px-2 pt-8 pb-4 lg:px-0 lg:pt-12">
      <div className="absolute left-0 top-8 size-64 rounded-full bg-[rgba(55,101,107,0.12)] blur-3xl" />
      <div className="absolute bottom-0 right-0 size-52 rounded-full bg-[rgba(128,84,59,0.12)] blur-3xl" />

      <div className="relative grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold" style={{ backgroundColor: 'rgba(128,84,59,0.1)', color: '#80543b' }}>
            <Sparkles className="size-4" />
            {copy.badge}
          </div>

          <div className="space-y-5">
            <h1 className="brand-display max-w-3xl text-5xl font-semibold leading-[0.94] tracking-tight text-charcoal sm:text-6xl xl:text-[4.7rem]">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-charcoal/70 lg:max-w-xl lg:text-[1.1rem]">
              {copy.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }), 'min-w-44')}>
              {copy.ctaPrimary}
            </Link>
            <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-w-36')}>
              {copy.ctaSecondary}
            </Link>
          </div>

          <div className="flex items-center gap-3 px-1">
            <div className="flex -space-x-2">
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#d1e3e6] text-[11px] font-bold text-[#37656b]">A</span>
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#f4ba9b] text-[11px] font-bold text-[#653d26]">B</span>
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#bbebf2] text-[11px] font-bold text-[#1d4d53]">C</span>
            </div>
            <span className="text-sm font-medium text-[#516164]">
              {locale === 'id' ? 'Dipakai ribuan creator digital.' : 'Joined by thousands of digital creators.'}
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] bg-white p-5 shadow-[0_18px_44px_-18px_rgba(55,101,107,0.22)]">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.3rem] px-4 py-3 text-sm" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
              <div className="flex gap-2">
                <span className="size-3 rounded-full bg-[rgba(186,26,26,0.2)]" />
                <span className="size-3 rounded-full bg-[rgba(128,84,59,0.2)]" />
                <span className="size-3 rounded-full bg-[rgba(55,101,107,0.2)]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: '#70787a' }}>
                {locale === 'id' ? 'Live Output Stream' : 'Live Output Stream'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {heroExamples.map((example, index) => (
                <article key={example.image} className="group relative aspect-square overflow-hidden rounded-[1.2rem]" style={{ backgroundColor: '#f4f3f3' }}>
                  <Image src={example.image} alt={copy.examples[index]} fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="(max-width: 1024px) 50vw, 280px" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-[#37656b] backdrop-blur">
                    {copy.examples[index].split(' ')[0]}
                  </div>
                </article>
              ))}
              <article className="group relative aspect-square overflow-hidden rounded-[1.2rem]" style={{ backgroundColor: '#f4f3f3' }}>
                <Image src="/samples/line-art.jpg" alt="Line art output example" fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="(max-width: 1024px) 50vw, 280px" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-[#37656b] backdrop-blur">
                  Line Art
                </div>
              </article>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-6 -top-6 size-44 rounded-full bg-[rgba(55,101,107,0.12)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 size-36 rounded-full bg-[rgba(128,84,59,0.1)] blur-3xl" />
        </div>
      </div>
    </section>
  )
}
