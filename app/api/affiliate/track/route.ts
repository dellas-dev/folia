import { NextResponse } from 'next/server'

import { getAffiliateByCode, normalizeAffiliateCode, recordAffiliateClick } from '@/lib/affiliate'

function getSafeRedirectTarget(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }

  return value
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = normalizeAffiliateCode(searchParams.get('code'))
  const redirectTarget = getSafeRedirectTarget(searchParams.get('redirect'))
  const response = NextResponse.redirect(new URL(redirectTarget, origin))

  if (!code) {
    return response
  }

  const affiliate = await getAffiliateByCode(code)

  if (!affiliate) {
    return response
  }

  await recordAffiliateClick(affiliate)
  response.cookies.set('ref', affiliate.code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
