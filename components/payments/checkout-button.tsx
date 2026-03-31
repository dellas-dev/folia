'use client'

import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { trackClientEvent } from '@/lib/analytics/client'
import { cn } from '@/lib/utils'

type CheckoutButtonProps = {
  plan: 'starter' | 'pro' | 'business' | 'topup'
  currency: 'IDR' | 'USD'
  children: React.ReactNode
  className?: string
}

export function CheckoutButton({ plan, currency, children, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true)

        try {
          trackClientEvent('upgrade_clicked', {
            plan,
            currency,
          })

          const response = await fetch('/api/payments/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan, currency }),
          })

          const data = await response.json() as { error?: string; checkout_url?: string }

          if (!response.ok || !data.checkout_url) {
            throw new Error(data.error || 'Unable to start checkout.')
          }

          window.location.href = data.checkout_url
        } catch (error) {
          window.alert(error instanceof Error ? error.message : 'Unable to start checkout.')
          setLoading(false)
        }
      }}
      className={cn(buttonVariants({ size: 'lg' }), className)}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </button>
  )
}
