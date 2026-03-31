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
    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2 py-1 text-xs font-medium text-muted-foreground">
      <span className="px-2">{copy.label}</span>
      {(['en', 'id'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => updateLocale(option)}
          disabled={isPending}
          className={cn(
            'rounded-full px-3 py-1 transition-colors',
            locale === option ? 'bg-primary text-primary-foreground' : 'hover:bg-muted hover:text-foreground'
          )}
        >
          {copy[option]}
        </button>
      ))}
    </div>
  )
}
