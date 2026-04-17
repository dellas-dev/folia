import Link from 'next/link'

import { auth } from '@clerk/nextjs/server'

import { FoliaLogo } from '@/components/brand/folia-logo'
import { LanguageSwitcher } from '@/components/marketing/language-switcher'
import { marketingCopy } from '@/lib/marketing/copy'
import { getMarketingLocale } from '@/lib/marketing/locale'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  const locale = await getMarketingLocale()
  const copy = marketingCopy[locale].nav

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-30 border-b border-[rgba(192,200,201,0.15)] px-4 py-4 sm:px-6 lg:px-12"
        style={{ backgroundColor: 'rgba(249,249,249,0.7)', backdropFilter: 'blur(20px)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <FoliaLogo imageClassName="h-10 sm:h-11" />
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <Link href="/community" className="nav-link-marketing text-sm font-medium">{copy.community}</Link>
              <Link href="/pricing" className="nav-link-marketing text-sm font-medium">{copy.pricing}</Link>
              <Link href="/sign-in" className="nav-link-marketing text-sm font-medium">{copy.signIn}</Link>
            </nav>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <LanguageSwitcher locale={locale} />
            <Link
              href={userId ? '/dashboard' : '/sign-up'}
              className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 14px rgba(55,101,107,0.25)' }}
            >
              {userId ? copy.openDashboard : copy.getStarted}
            </Link>
          </div>

          <nav
            className="flex w-full items-center gap-3 overflow-x-auto rounded-full px-4 py-2 text-sm font-medium md:hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: '#70787a', boxShadow: '0 10px 24px -20px rgba(55,101,107,0.15)' }}
          >
            <Link href="/community" className="whitespace-nowrap nav-link-marketing">{copy.community}</Link>
            <Link href="/pricing" className="whitespace-nowrap nav-link-marketing">{copy.pricing}</Link>
            <Link href="/sign-in" className="whitespace-nowrap nav-link-marketing">{copy.signIn}</Link>
            <LanguageSwitcher locale={locale} />
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
