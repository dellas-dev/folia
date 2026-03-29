import { AlertCircle, Coins } from 'lucide-react'

import type { Profile } from '@/lib/clerk/auth'
import { cn } from '@/lib/utils'

type CreditsBadgeProps = {
  profile: Pick<Profile, 'credits' | 'tier'>
}

export function CreditsBadge({ profile }: CreditsBadgeProps) {
  const isLow = profile.credits < 3

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm shadow-black/5',
        isLow
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      )}
    >
      {isLow ? <AlertCircle className="size-4" /> : <Coins className="size-4" />}
      <span>{profile.credits} credits</span>
      <span className="text-xs uppercase tracking-[0.2em] opacity-70">{profile.tier}</span>
    </div>
  )
}
