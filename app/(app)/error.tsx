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
      <div className="max-w-lg rounded-3xl border border-border/70 bg-card/90 p-8 text-center shadow-sm shadow-black/5">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Something went wrong</p>
        <h1 className="mt-3 text-4xl font-semibold text-foreground">The workspace could not load.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Try again first. If it keeps happening, check the Clerk and Supabase connection for the current environment.
        </p>
        <button type="button" onClick={reset} className={cn(buttonVariants({ size: 'lg' }), 'mt-6')}>
          Try again
        </button>
      </div>
    </div>
  )
}
