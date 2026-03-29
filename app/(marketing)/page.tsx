import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

import { GenerationCounter } from '@/components/marketing/generation-counter'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

const styles = ['Watercolor', 'Line Art', 'Cartoon / Kawaii', 'Boho / Vintage', 'Minimalist / Flat']

export default function MarketingHomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <section className="grid gap-8 rounded-[2rem] border border-border/60 bg-card/85 p-8 shadow-lg shadow-black/5 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm text-accent-foreground">
            <Sparkles className="size-4" />
            Phase 1 foundation is live
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold leading-none tracking-tight text-foreground sm:text-6xl">
              Authenticated workspace for Folia is now ready to grow.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Folia helps Etsy sellers and digital product creators generate commercial-ready clipart elements and mockup imagery. This phase focuses on a safe Clerk auth flow and a reusable dashboard shell.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>
              Create account
            </Link>
            <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Explore plans
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.75rem] bg-[linear-gradient(180deg,oklch(0.98_0.01_84),oklch(0.94_0.03_145))] p-6">
          <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Included now</p>
            <ul className="mt-4 space-y-3 text-sm text-foreground/80">
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 text-primary" />Protected dashboard and route groups</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 text-primary" />Clerk sign-in and sign-up pages</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 text-primary" />Supabase profile sync via Clerk webhook</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="size-4 text-primary" />Credits-aware app shell components</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/60 p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Illustration styles</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {styles.map((style) => (
                <span key={style} className="rounded-full border border-border/70 bg-background/85 px-3 py-2 text-sm">
                  {style}
                </span>
              ))}
            </div>
            <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
              Visit the app shell
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <GenerationCounter />
    </div>
  )
}
