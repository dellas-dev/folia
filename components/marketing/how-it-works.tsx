'use client'

import { Images, Layers3, WandSparkles } from 'lucide-react'

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
    title: 'Download PNG',
    body: 'Save clean commercial-ready outputs for your listing images, printable packs, and product bundles.',
    icon: Images,
  },
] as const

export function HowItWorks() {
  return (
    <section className="grid gap-5 lg:grid-cols-3">
      {steps.map((step) => (
        <article key={step.title} className="rounded-[1.8rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5">
          <step.icon className="size-5 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold text-foreground">{step.title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.body}</p>
        </article>
      ))}
    </section>
  )
}
