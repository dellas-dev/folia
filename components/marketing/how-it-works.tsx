'use client'

import { Images, Layers3, WandSparkles } from 'lucide-react'

import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'

const steps = [
  {
    title: 'Pick a style',
    body: 'Choose watercolor, line art, cartoon, boho, or minimalist based on the type of product you are building.',
    icon: Layers3,
  },
  {
    title: 'Write or upload',
    body: 'Describe the element you need, or upload your invitation design when you want a polished mockup scene.',
    icon: WandSparkles,
  },
  {
    title: 'Download JPG or remove background',
    body: 'Save the white-background JPG first, then use Remove BG when you need a transparent PNG for listings or printables.',
    icon: Images,
  },
] as const

export function HowItWorks({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].howItWorks
  return (
    <section className="space-y-8 rounded-[2.2rem] p-8 lg:p-10" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.06)' }}>
      <div className="flex flex-col gap-3 md:max-w-2xl">
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: '#70787a' }}>How it works</p>
        <h2 className="brand-display text-4xl font-semibold sm:text-5xl" style={{ color: '#1a1c1c' }}>A calm workflow for generating listing-ready assets.</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className="relative rounded-[1.9rem] p-6" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.04)' }}>
            <div className="absolute right-6 top-6 text-[11px] font-medium uppercase tracking-[0.24em]" style={{ color: '#c0c8c9' }}>0{index + 1}</div>
            <span className="inline-flex size-12 items-center justify-center rounded-2xl" style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}>
              <step.icon className="size-5" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>{copy.steps[index].title}</h2>
            <p className="mt-3 max-w-sm text-sm leading-7" style={{ color: '#70787a' }}>{copy.steps[index].body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
