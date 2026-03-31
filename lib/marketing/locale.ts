import { cookies } from 'next/headers'

import { MARKETING_LOCALE_COOKIE, type MarketingLocale } from '@/lib/marketing/copy'

export async function getMarketingLocale(): Promise<MarketingLocale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(MARKETING_LOCALE_COOKIE)?.value
  return value === 'id' ? 'id' : 'en'
}
