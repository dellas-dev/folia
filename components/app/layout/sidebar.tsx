'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Gift,
  Images,
  LayoutDashboard,
  PanelsTopLeft,
  Scissors,
  Settings,
  WandSparkles,
} from 'lucide-react'

import { FoliaLogo } from '@/components/brand/folia-logo'
import { cn } from '@/lib/utils'

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/elements', label: 'Elements', icon: WandSparkles },
  { href: '/remove-bg', label: 'Remove BG', icon: Scissors },
  { href: '/mockups', label: 'Mockups', icon: PanelsTopLeft },
  { href: '/gallery', label: 'Gallery', icon: Images },
  { href: '/affiliate', label: 'Affiliate', icon: Gift },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar/90 lg:flex lg:flex-col">
        <div className="border-b border-sidebar-border px-6 py-7">
          <Link href="/dashboard" className="inline-flex items-center gap-3 text-sidebar-foreground">
            <FoliaLogo />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-2 px-4 py-5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-l-2 border-[#D4A843] bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 pb-4">
          <Link href="/settings/billing" className="block rounded-3xl border border-sidebar-border bg-background/70 p-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5">
            <p className="text-xs uppercase tracking-[0.2em]">Need more credits?</p>
            <p className="mt-1 font-medium text-[#D4A843]">Top up or upgrade plan →</p>
          </Link>
        </div>
      </aside>

      <div className="border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mb-3 flex items-center gap-3">
          <FoliaLogo showTagline={false} markClassName="size-10 rounded-2xl" lockupClassName="pt-0.5" />
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-card-foreground'
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
