'use client'

import { useEffect } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-lg rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,243,238,0.92))] p-8 text-center shadow-[0_10px_40px_-10px_rgba(27,28,25,0.06)]">
        <p className="text-sm uppercase tracking-[0.24em] text-charcoal/45">Something went wrong</p>
        <h1 className="mt-3 text-4xl font-semibold text-charcoal">The workspace could not load.</h1>
        <p className="mt-4 text-base leading-7 text-charcoal/65">
          Try again first. If it keeps happening, check the Clerk and Supabase connection for the current environment.
        </p>
        <button type="button" onClick={reset} className={cn(buttonVariants({ size: 'lg' }), 'mt-6')}>
          Try again
        </button>
      </div>
    </div>
  )
}
