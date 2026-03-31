import Link from 'next/link'

import { auth } from '@clerk/nextjs/server'

import { FoliaLogo } from '@/components/brand/folia-logo'
import { LanguageSwitcher } from '@/components/marketing/language-switcher'
import { buttonVariants } from '@/components/ui/button-variants'
import { marketingCopy } from '@/lib/marketing/copy'
import { getMarketingLocale } from '@/lib/marketing/locale'
import { cn } from '@/lib/utils'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  const locale = await getMarketingLocale()
  const copy = marketingCopy[locale].nav

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <FoliaLogo markClassName="size-10 rounded-2xl" />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/community" className="transition-colors hover:text-foreground">{copy.community}</Link>
            <Link href="/pricing" className="transition-colors hover:text-foreground">{copy.pricing}</Link>
            <Link href="/sign-in" className="transition-colors hover:text-foreground">{copy.signIn}</Link>
          </nav>

          <div className="hidden md:block">
            <LanguageSwitcher locale={locale} />
          </div>

          <Link
            href={userId ? '/dashboard' : '/sign-up'}
            className={cn(buttonVariants({ size: 'lg' }), 'w-full justify-center sm:w-auto')}
          >
            {userId ? copy.openDashboard : copy.getStarted}
          </Link>

          <nav className="flex w-full items-center gap-4 overflow-x-auto text-sm font-medium text-muted-foreground md:hidden">
            <Link href="/community" className="whitespace-nowrap transition-colors hover:text-foreground">{copy.community}</Link>
            <Link href="/pricing" className="whitespace-nowrap transition-colors hover:text-foreground">{copy.pricing}</Link>
            <Link href="/sign-in" className="whitespace-nowrap transition-colors hover:text-foreground">{copy.signIn}</Link>
            <LanguageSwitcher locale={locale} />
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
