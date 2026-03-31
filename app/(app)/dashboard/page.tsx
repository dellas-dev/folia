import Link from 'next/link'
import { ArrowRight, CreditCard, Images, Sparkles, WandSparkles } from 'lucide-react'

import { GenerationCounter } from '@/components/marketing/generation-counter'
import { buttonVariants } from '@/components/ui/button-variants'
import { requireCurrentProfile } from '@/lib/clerk/auth'
import { cn } from '@/lib/utils'

const tierCreditCap = {
  none: 8,
  starter: 8,
  pro: 40,
  business: 80,
} as const

const quickActions = [
  {
    href: '/elements',
    label: 'Generate element',
    description: 'Create your next clipart asset from a prompt or reference image.',
    icon: WandSparkles,
  },
  {
    href: '/mockups',
    label: 'Open mockups',
    description: 'Turn flat invitation artwork into styled listing scenes.',
    icon: Sparkles,
  },
  {
    href: '/gallery',
    label: 'View gallery',
    description: 'Review saved generations, re-download files, and manage visibility.',
    icon: Images,
  },
]

export default async function DashboardPage() {
  const { profile } = await requireCurrentProfile()
  const creditCap = tierCreditCap[profile.tier]
  const progress = Math.max(0, Math.min(100, Math.round((profile.credits / Math.max(creditCap, 1)) * 100)))
  const noCredits = profile.credits === 0

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Credits overview</p>
              <h2 className="text-5xl font-semibold text-foreground">{profile.credits}</h2>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Tier: <span className="font-medium capitalize text-foreground">{profile.tier}</span>. Use credits to generate clipart elements and mockups, then keep your best results in the gallery.
              </p>
            </div>
            <Link href="/pricing" className={cn(buttonVariants({ size: 'lg' }))}>
              {noCredits ? 'Buy credits' : 'Manage plan'}
            </Link>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Available credits</span>
              <span>{progress}% of current tier pack</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {noCredits ? (
            <div className="mt-8 rounded-3xl border border-dashed border-border bg-secondary/40 p-5">
              <p className="text-lg font-medium text-foreground">Your workspace is ready, but you do not have credits yet.</p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Start with a paid plan to unlock generation. Once you have credits, you can create elements, build mockups, and save everything in your gallery.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/pricing" className={cn(buttonVariants({ size: 'lg' }))}>
                  Buy credits
                </Link>
                <Link href="/settings/billing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
                  Open billing
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-border/70 bg-background p-5">
              <p className="text-lg font-medium text-foreground">You are ready to create.</p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Generate a fresh element, build a mockup from your invitation artwork, or open your gallery to manage previous results.
              </p>
            </div>
          )}
        </article>

        <article className="rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,oklch(0.98_0.015_84),oklch(0.94_0.04_145))] p-8 shadow-sm shadow-black/5">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Next milestone</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground">Create your next best seller faster.</h2>
          <p className="mt-3 text-sm leading-7 text-foreground/75">
            Start with elements for clipart packs, then move into mockups when you need better listing images for your storefront.
          </p>
          <Link href="/elements" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
            Open generator
            <ArrowRight className="size-4" />
          </Link>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.href}
              href={action.href}
            className="rounded-[1.8rem] border border-border/70 bg-card/85 p-6 shadow-sm shadow-black/5 transition-transform hover:-translate-y-0.5"
          >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-2xl font-semibold text-foreground">{action.label}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{action.description}</p>
            </Link>
          )
        })}
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Billing status</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">Manage credits, upgrades, and subscription status.</h2>
          </div>
          <Link href="/settings/billing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            <CreditCard className="size-4" />
            Billing settings
          </Link>
        </div>
      </section>

      <GenerationCounter />
    </div>
  )
}
