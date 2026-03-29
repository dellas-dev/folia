'use client'

import { useEffect } from 'react'

type RefCookieSyncProps = {
  referralCode?: string
}

export function RefCookieSync({ referralCode }: RefCookieSyncProps) {
  useEffect(() => {
    if (!referralCode) {
      return
    }

    document.cookie = `ref=${encodeURIComponent(referralCode)}; path=/; max-age=2592000; samesite=lax`
  }, [referralCode])

  return null
}
