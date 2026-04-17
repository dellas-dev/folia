'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Gift,
  HelpCircle,
  Images,
  LayoutDashboard,
  LogOut,
  PanelsTopLeft,
  Plus,
  Scissors,
  Settings,
  WandSparkles,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/elements', label: 'Elements', icon: WandSparkles },
  { href: '/remove-bg', label: 'Remove BG', icon: Scissors },
  { href: '/mockups', label: 'Mockups', icon: PanelsTopLeft },
  { href: '/gallery', label: 'Gallery', icon: Images },
  { href: '/affiliate', label: 'Affiliate', icon: Gift },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col justify-between border-r border-[rgba(192,200,201,0.15)] bg-white p-6 lg:flex">
        <div className="space-y-6">
          <Link href="/dashboard" className="block">
            <img
              src="/brand_asset/logo_folia.png"
              alt="Folia"
              className="block h-auto w-full max-w-[208px] object-contain"
            />
          </Link>

          <Link
            href="/elements"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[rgba(55,101,107,0.12)] px-4 text-sm font-semibold text-[#37656b] shadow-[0_8px_20px_-18px_rgba(55,101,107,0.28)] transition-colors hover:bg-[#eef4f4]"
            style={{ backgroundColor: '#f7faf9' }}
          >
            <Plus className="size-4" />
            New Creation
          </Link>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-[#37656b] font-medium text-white shadow-[0_10px_24px_-14px_rgba(55,101,107,0.55)]'
                      : 'text-[#697a7d] hover:bg-[#f5f5f5]'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="font-semibold tracking-tight">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-[rgba(192,200,201,0.15)] pt-6">
          <div className="mb-4 flex items-center gap-3 px-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#d1e3e6] text-sm font-bold text-[#37656b]">
              FL
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#1a1c1c]">Pro Tier</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#70787a]">Active</span>
            </div>
          </div>

          <button className="flex w-full items-center gap-3 rounded-full px-4 py-2 text-sm text-[#697a7d] transition-colors hover:bg-[#f5f5f5]">
            <HelpCircle className="size-4 shrink-0" />
            <span>Help</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-full px-4 py-2 text-sm text-[#697a7d] transition-colors hover:bg-[#f5f5f5]">
            <LogOut className="size-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-[rgba(192,200,201,0.15)] bg-white/92 px-4 py-3 backdrop-blur-[20px] lg:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center">
            <img
              src="/brand_asset/logo_folia.png"
              alt="Folia"
              className="block h-auto w-full max-w-[152px] object-contain"
            />
          </Link>
          <Link
            href="/elements"
            className="flex h-9 items-center gap-1.5 rounded-full border border-[rgba(55,101,107,0.12)] px-3 text-xs font-semibold text-[#37656b]"
            style={{ backgroundColor: '#f7faf9' }}
          >
            <Plus className="size-3.5" />
            New
          </Link>
        </div>

        <nav className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-[#37656b] text-white'
                    : 'bg-[#eeeeee] text-[#516164]'
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
