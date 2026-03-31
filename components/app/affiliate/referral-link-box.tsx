'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button-variants'
import { trackClientEvent } from '@/lib/analytics/client'
import { cn } from '@/lib/utils'

type ReferralLinkBoxProps = {
  code: string
  referralUrl: string
}

export function ReferralLinkBox({ code, referralUrl }: ReferralLinkBoxProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl)
    trackClientEvent('referral_shared', {
      code,
      destination: 'clipboard',
    })
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-[1.6rem] border border-border/70 bg-background p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Referral code</p>
      <p className="mt-2 text-2xl font-semibold tracking-[0.16em] text-foreground">{code}</p>
      <label className="mt-5 block text-sm font-medium text-foreground" htmlFor="referral-link">
        Referral link
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="referral-link"
          readOnly
          value={referralUrl}
          className="min-h-11 flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
        />
        <button
          type="button"
          onClick={handleCopy}
          className={cn(buttonVariants({ size: 'lg' }), 'min-w-28')}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
