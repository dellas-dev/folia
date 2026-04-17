'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { FoliaLogo } from '@/components/brand/folia-logo'
import { marketingCopy, type MarketingLocale } from '@/lib/marketing/copy'

export function MarketingFooter({ locale }: { locale: MarketingLocale }) {
  const copy = marketingCopy[locale].footer
  return (
    <footer className="rounded-[2.2rem] p-8" style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.06)' }}>
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <FoliaLogo imageClassName="h-10 w-auto" />
          <p className="mt-6 max-w-sm text-sm leading-7" style={{ color: '#70787a' }}>
            The curated atelier workspace for modern creators.
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: '#c0c8c9' }}>Explore</p>
          <div className="mt-5 flex flex-col gap-4 text-sm font-bold">
            <Link href="/community" className="footer-link-marketing">Community</Link>
            <Link href="/pricing" className="footer-link-marketing">Pricing</Link>
            <Link href="/sign-in" className="footer-link-marketing">Sign in</Link>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: '#c0c8c9' }}>Start</p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 14px rgba(55,101,107,0.25)' }}
            >
              {copy.primary}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors hover:bg-[#eeeeee]"
              style={{ backgroundColor: '#f4f3f3', color: '#404849' }}
            >
              {copy.secondary}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
