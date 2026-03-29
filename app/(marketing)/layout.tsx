import Link from 'next/link'

import { auth } from '@clerk/nextjs/server'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">F</span>
            <div>
              <p className="text-xl font-semibold leading-none">Folia</p>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">AI clipart for sellers</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/community" className="transition-colors hover:text-foreground">Community</Link>
            <Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
            <Link href="/sign-in" className="transition-colors hover:text-foreground">Sign in</Link>
          </nav>

          <Link
            href={userId ? '/dashboard' : '/sign-up'}
            className={cn(buttonVariants({ size: 'lg' }))}
          >
            {userId ? 'Open dashboard' : 'Get started'}
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
