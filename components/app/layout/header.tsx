import { UserButton } from '@clerk/nextjs'

import type { Profile } from '@/lib/clerk/auth'

import { CreditsBadge } from './credits-badge'

type AppHeaderProps = {
  firstName?: string | null
  profile: Pick<Profile, 'credits' | 'tier'>
}

export function AppHeader({ firstName, profile }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Workspace</p>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Welcome back{firstName ? `, ${firstName}` : ''}</h1>
            <p className="text-sm text-muted-foreground">Generate isolated clipart fast, then grow into mockups, gallery, and billing flows.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CreditsBadge profile={profile} />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
