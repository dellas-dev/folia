'use client'

import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'

export function Faq({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].faq
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
      <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">{copy.eyebrow}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {copy.items.map(([question, answer]) => (
          <article key={question} className="rounded-[1.4rem] border border-border/70 bg-background p-5">
            <h2 className="text-lg font-semibold text-foreground">{question}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{answer}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
