import Link from 'next/link'
import { Sparkles } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

type PagePlaceholderProps = {
  eyebrow: string
  title: string
  subtitle: string
  body: string
}

export function PagePlaceholder({
  eyebrow,
  title,
  subtitle,
  body,
}: PagePlaceholderProps) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
      <div className="flex max-w-2xl flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-accent-foreground">
            <Sparkles className="size-4" />
            {eyebrow}
          </span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">{subtitle}</p>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className={cn(buttonVariants({ size: 'lg' }))}>
            Back to dashboard
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            View plans
          </Link>
        </div>
      </div>
    </section>
  )
}
