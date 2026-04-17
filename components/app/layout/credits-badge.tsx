import type { Profile } from '@/lib/clerk/auth'

type CreditsBadgeProps = {
  profile: Pick<Profile, 'credits' | 'tier'>
}

export function CreditsBadge({ profile }: CreditsBadgeProps) {
  const isLow = profile.credits < 3

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
      style={{
        backgroundColor: isLow ? 'rgba(255,218,214,0.85)' : 'rgba(209,227,230,0.6)',
        color: isLow ? '#93000a' : '#37656b',
      }}
    >
      <span className="tabular-nums">{profile.credits.toLocaleString('en-US')} credits</span>
    </div>
  )
}
