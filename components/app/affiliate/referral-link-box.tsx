'use client'

import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'

import { trackClientEvent } from '@/lib/analytics/client'

type ReferralLinkBoxProps = {
  code: string
  referralUrl: string
}

export function ReferralLinkBox({ code, referralUrl }: ReferralLinkBoxProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl)
    trackClientEvent('referral_shared', { code, destination: 'clipboard' })
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-[1.5rem] p-6"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
          Your Unique Referral Link
        </p>
        <span
          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}
        >
          Share &amp; Earn
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          className="flex flex-1 items-center rounded-full px-5 py-4"
          style={{ backgroundColor: '#f5f5f5', border: '1px solid rgba(192,200,201,0.12)' }}
        >
          <span className="truncate text-sm font-medium" style={{ color: '#37656b' }}>
            {referralUrl}
          </span>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex size-14 items-center justify-center rounded-full text-white shadow-[0_14px_30px_-18px_rgba(55,101,107,0.55)] transition-transform hover:scale-105"
            style={{ backgroundColor: '#37656b' }}
            aria-label={copied ? 'Copied' : 'Copy referral link'}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
          <button
            type="button"
            className="flex size-14 items-center justify-center rounded-full transition-colors hover:scale-105"
            style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}
            aria-label="Share"
          >
            <Share2 className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
