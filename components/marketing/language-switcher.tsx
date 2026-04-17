'use client'

import { useTransition } from 'react'

import { MARKETING_LOCALE_COOKIE, type MarketingLocale, marketingCopy } from '@/lib/marketing/copy'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  locale: MarketingLocale
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition()
  const copy = marketingCopy[locale].language

  function updateLocale(nextLocale: MarketingLocale) {
    if (nextLocale === locale) {
      return
    }

    startTransition(() => {
      document.cookie = `${MARKETING_LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
      window.location.reload()
    })
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium backdrop-blur-[20px]" style={{ backgroundColor: 'rgba(249,249,249,0.8)', color: '#70787a', boxShadow: '0 2px 8px rgba(55,101,107,0.06)' }}>
      <span className="px-2">{copy.label}</span>
      {(['en', 'id'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => updateLocale(option)}
          disabled={isPending}
          className="rounded-full px-3 py-1 transition-colors"
          style={locale === option
            ? { backgroundColor: '#d1e3e6', color: '#37656b' }
            : undefined
          }
        >
          {copy[option]}
        </button>
      ))}
    </div>
  )
}
