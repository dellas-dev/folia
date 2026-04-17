'use client'

import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'

export function Faq({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].faq
  return (
    <section className="rounded-[2.2rem] p-8 lg:p-10" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.06)' }}>
      <p className="text-xs uppercase tracking-[0.28em]" style={{ color: '#70787a' }}>{copy.eyebrow}</p>
      <h2 className="brand-display mt-2 text-4xl font-semibold sm:text-5xl" style={{ color: '#1a1c1c' }}>Questions creators ask before they commit.</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {copy.items.map(([question, answer], index) => (
          <article key={question} className="rounded-[1.8rem] p-5" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
            <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: '#c0c8c9' }}>0{index + 1}</p>
            <h2 className="mt-3 text-lg font-semibold" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>{question}</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: '#70787a' }}>{answer}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
