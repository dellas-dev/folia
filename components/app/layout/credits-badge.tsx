import { AlertCircle, Coins } from 'lucide-react'

import type { Profile } from '@/lib/clerk/auth'
import { cn } from '@/lib/utils'

type CreditsBadgeProps = {
  profile: Pick<Profile, 'credits' | 'tier'>
}

export function CreditsBadge({ profile }: CreditsBadgeProps) {
  return (
    <div
      className={cn('inline-flex items-center gap-2 rounded-full border border-[#D4A843] bg-[#D4A843] px-3 py-2 text-sm font-medium text-[#2C2C2A] shadow-sm shadow-black/5')}
    >
      {profile.credits < 3 ? <AlertCircle className="size-4" /> : <Coins className="size-4" />}
      <span>{profile.credits} credits</span>
      <span className="rounded-full bg-[#D4A843] px-2 py-1 text-xs uppercase tracking-[0.2em] text-[#2C2C2A]">{profile.tier}</span>
    </div>
  )
}
