'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button-variants'
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

export function Hero() {
  return (
    <section className="grid gap-8 rounded-[2rem] border border-border/60 bg-card/85 p-8 shadow-lg shadow-black/5 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm text-accent-foreground">
          <Sparkles className="size-4" />
          AI assets for digital product sellers
        </div>
        <div className="space-y-4">
          <h1 className="max-w-3xl text-5xl font-semibold leading-none tracking-tight text-foreground sm:text-6xl">
            Create clipart and mockups that are ready for your next Etsy listing.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Folia helps you generate commercial-ready elements, themed illustration packs, and styled invitation mockups without building every asset from scratch.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>
            Start for Rp 15.000
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            View pricing
          </Link>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.75rem] bg-[linear-gradient(180deg,oklch(0.98_0.01_84),oklch(0.94_0.03_145))] p-6">
        {heroExamples.map((example, index) => (
          <div key={example.title} className={cn('overflow-hidden rounded-3xl border border-white/60 shadow-sm', index === 0 ? 'bg-white/75' : 'bg-white/60')}>
            <div className="relative aspect-[16/10] w-full">
              <Image src={example.image} alt={example.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 420px" />
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Example output</p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{example.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Clean Etsy-friendly artwork styles built for invites, stickers, wall art, and printable bundles.
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
