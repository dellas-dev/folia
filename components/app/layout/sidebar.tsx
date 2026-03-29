'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GalleryVerticalEnd,
  Gift,
  Images,
  LayoutDashboard,
  PanelsTopLeft,
  Settings,
  WandSparkles,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/elements', label: 'Elements', icon: WandSparkles },
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
            <span className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20">
              <GalleryVerticalEnd className="size-5" />
            </span>
            <span>
              <span className="block text-2xl font-semibold leading-none">Folia</span>
              <span className="mt-1 block text-sm text-muted-foreground">AI clipart workspace</span>
            </span>
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
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20'
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
          <div className="rounded-3xl border border-sidebar-border bg-background/70 p-4 text-sm text-muted-foreground">
            Phase 1 sets up auth and the shell. Generators, gallery syncing, and billing wire in next phases.
          </div>
        </div>
      </aside>

      <div className="border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <GalleryVerticalEnd className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold leading-none">Folia</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">App shell</p>
          </div>
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
