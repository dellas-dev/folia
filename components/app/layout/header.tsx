'use client'

import { Bell } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

import type { Profile } from '@/lib/clerk/auth'

import { CreditsBadge } from './credits-badge'

type AppHeaderProps = {
  firstName?: string | null
  profile: Pick<Profile, 'credits' | 'tier'>
}

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/elements': 'Elements Generator',
  '/remove-bg': 'Remove Background',
  '/mockups': 'Mockup Generator',
  '/gallery': 'Folia Gallery',
  '/affiliate': 'Affiliate Dashboard',
  '/settings': 'Settings',
  '/settings/billing': 'Billing & Credits',
}

function resolveTitle(pathname: string) {
  if (pathname in titles) return titles[pathname]
  if (pathname.startsWith('/settings/billing')) return titles['/settings/billing']
  if (pathname.startsWith('/settings')) return titles['/settings']
  return 'Folia Workspace'
}

export function AppHeader({ firstName: _firstName, profile }: AppHeaderProps) {
  const pathname = usePathname()
  const title = resolveTitle(pathname)

  return (
    <header
      className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-[rgba(192,200,201,0.15)] bg-white/92 px-8 backdrop-blur-[20px] lg:flex"
    >
      <h1 className="brand-display text-lg font-bold text-neutral-900">{title}</h1>

      <div className="flex items-center gap-6">
        <CreditsBadge profile={profile} />

        <button
          className="flex size-9 items-center justify-center rounded-full text-[#516164] transition-colors hover:bg-[#f5f5f5] hover:text-[#37656b]"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>

        <div className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-[rgba(192,200,201,0.2)] bg-[#e2e2e2]">
          <UserButton />
        </div>
      </div>
    </header>
  )
}
