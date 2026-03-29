'use client'

import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

import { RefCookieSync } from '@/components/auth/ref-cookie-sync'

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref') ?? undefined

  return (
    <>
      <RefCookieSync referralCode={referralCode} />
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </>
  )
}
