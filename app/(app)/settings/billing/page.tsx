import Link from 'next/link'

import { CheckoutButton } from '@/components/payments/checkout-button'
import { buttonVariants } from '@/components/ui/button-variants'
import { requireCurrentProfile } from '@/lib/clerk/auth'
import { cn } from '@/lib/utils'

export default async function BillingPage() {
  const { profile } = await requireCurrentProfile()

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Billing</p>
        <h1 className="mt-2 text-5xl font-semibold text-foreground">Manage credits, plan upgrades, and checkout links.</h1>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[1.6rem] border border-border/70 bg-background p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current tier</p>
            <h2 className="mt-2 text-3xl font-semibold capitalize text-foreground">{profile.tier}</h2>
          </div>
          <div className="rounded-[1.6rem] border border-border/70 bg-background p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Credits</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">{profile.credits}</h2>
          </div>
          <div className="rounded-[1.6rem] border border-border/70 bg-background p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Subscription status</p>
            <h2 className="mt-2 text-3xl font-semibold capitalize text-foreground">{profile.subscription_status}</h2>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[1.8rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5">
          <h2 className="text-2xl font-semibold text-foreground">Indonesia checkout</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Use Mayar for IDR purchases. Subscription activation depends on Mayar merchant verification status.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CheckoutButton plan="starter" currency="IDR">Buy Starter</CheckoutButton>
            <CheckoutButton plan="topup" currency="IDR">Buy Top-up</CheckoutButton>
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5">
          <h2 className="text-2xl font-semibold text-foreground">International checkout</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Use Polar for USD checkout and subscription handling with tax-compliant international payments.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CheckoutButton plan="pro" currency="USD">Upgrade to Pro</CheckoutButton>
            <CheckoutButton plan="business" currency="USD">Upgrade to Business</CheckoutButton>
            <CheckoutButton plan="topup" currency="USD">Buy Top-up</CheckoutButton>
          </div>
        </article>
      </section>

      <section className="rounded-[1.8rem] border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5">
        <h2 className="text-2xl font-semibold text-foreground">Subscription management</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">Customer self-serve management links depend on the active provider portal. For now, start a new checkout or contact support if you need manual changes during development.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>Back to pricing</Link>
        </div>
      </section>
    </div>
  )
}
