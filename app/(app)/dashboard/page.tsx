import Link from 'next/link'
import {
  ArrowRight,
  Images,
  ImagePlus,
  PanelsTopLeft,
  Sparkles,
  WandSparkles,
  Zap,
} from 'lucide-react'

import { requireCurrentProfile } from '@/lib/clerk/auth'

const tierCreditCap = {
  none: 8,
  starter: 50,
  pro: 250,
  business: 999,
} as const

const quickActions = [
  {
    href: '/elements',
    label: 'Generate Element',
    description: 'AI-powered clipart for your Etsy listings.',
    icon: Sparkles,
  },
  {
    href: '/mockups',
    label: 'Open Mockups',
    description: 'Place assets into lifestyle scenes.',
    icon: PanelsTopLeft,
  },
  {
    href: '/gallery',
    label: 'View Gallery',
    description: 'Manage your previous creations.',
    icon: Images,
  },
] as const

const recentCreations = [
  {
    title: 'Summer Flora #04',
    badge: 'Watercolor',
    meta: 'Modified 2h ago',
    bg: 'linear-gradient(135deg, #e8f4f8 0%, #d4e9ef 50%, #c2dde6 100%)',
    accent: '#507e84',
  },
  {
    title: 'Abstract Terracotta',
    badge: 'Line Art',
    meta: 'Modified 5h ago',
    bg: 'linear-gradient(135deg, #f5ede8 0%, #eeddd4 50%, #e3ccc0 100%)',
    accent: '#80543b',
  },
  {
    title: 'Geometric Alps',
    badge: '3D Render',
    meta: 'Modified 1d ago',
    bg: 'linear-gradient(135deg, #eef3f4 0%, #ddeaec 50%, #cce0e4 100%)',
    accent: '#37656b',
  },
] as const

export default async function DashboardPage() {
  const { user, profile } = await requireCurrentProfile()
  const creditCap = tierCreditCap[profile.tier] ?? 50
  const usedCredits = Math.max(0, creditCap - profile.credits)
  const progress = Math.max(0, Math.min(100, Math.round((usedCredits / Math.max(creditCap, 1)) * 100)))

  return (
    <div className="space-y-6 pb-8">

      {/* ── Welcome ───────────────────────────────────────────── */}
      <section className="px-1 pt-2">
        <p
          className="text-sm font-semibold uppercase tracking-[0.18em]"
          style={{ color: '#70787a' }}
        >
          Dashboard
        </p>
        <h1
          className="mt-1 text-4xl font-bold leading-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.025em' }}
        >
          Welcome back,{' '}
          <span style={{ color: '#37656b' }}>{user.firstName ?? 'Creator'}</span>
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7" style={{ color: '#70787a' }}>
          Your AI artisan studio is ready. Create clipart and mockups for your Etsy shop.
        </p>
      </section>

      {/* ── Credits + Feature cards ────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">

        {/* Credits card */}
        <article
          className="relative overflow-hidden rounded-[1.5rem] p-6"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(55,101,107,0.06), 0 12px 32px rgba(55,101,107,0.06)',
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: '#70787a' }}
          >
            Monthly Allowance
          </p>

          <div className="mt-4 flex items-end gap-2">
            <span
              className="text-6xl font-bold leading-none tabular-nums"
              style={{ fontFamily: 'var(--font-heading)', color: '#37656b' }}
            >
              {profile.credits}
            </span>
            <span className="mb-1.5 text-xl font-medium" style={{ color: '#c0c8c9' }}>
              /{creditCap}
            </span>
          </div>

          <p className="mt-1 text-sm" style={{ color: '#70787a' }}>credits remaining</p>

          {/* Progress */}
          <div className="mt-6 h-2 overflow-hidden rounded-full" style={{ backgroundColor: '#eeeeee' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #37656b, #507e84)',
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs" style={{ color: '#70787a' }}>{progress}% utilized</p>
            <Link
              href="/settings/billing"
              className="text-xs font-semibold underline underline-offset-2"
              style={{ color: '#37656b' }}
            >
              Upgrade plan
            </Link>
          </div>

          {/* decorative */}
          <div
            className="pointer-events-none absolute -bottom-6 -right-6 size-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #37656b, transparent 70%)' }}
          />
        </article>

        {/* Feature card */}
        <article
          className="relative overflow-hidden rounded-[1.5rem] p-6 sm:p-7"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(55,101,107,0.06), 0 12px 32px rgba(55,101,107,0.06)',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ backgroundColor: '#f4ba9b', color: '#311302' }}
              >
                <Zap className="size-3" />
                Beta Feature
              </span>
              <h2
                className="mt-4 text-3xl font-bold leading-tight"
                style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}
              >
                Element Generator
                <br />
                v2.4
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6" style={{ color: '#70787a' }}>
                Optimizing vector outputs and watercolor texture fidelity for listing-ready assets.
              </p>

              {/* Progress */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: '#404849' }}>68% Complete</span>
                  <span className="text-xs" style={{ color: '#70787a' }}>Next update: 14 Jan</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#eeeeee' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: '68%', background: 'linear-gradient(90deg, #37656b, #507e84)' }}
                  />
                </div>
              </div>
            </div>

            <div
              className="flex size-20 shrink-0 items-center justify-center rounded-[1.25rem] shadow-[0_8px_24px_-8px_rgba(55,101,107,0.3)]"
              style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
            >
              <ImagePlus className="size-9 text-white" />
            </div>
          </div>
        </article>
      </div>

      {/* ── Quick Workspace ────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}
          >
            Quick Workspace
          </h2>
          <span className="text-sm" style={{ color: '#70787a' }}>+</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 rounded-[1.25rem] p-5 transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.05)',
                }}
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-[0.875rem]"
                  style={{ backgroundColor: '#d1e3e6' }}
                >
                  <Icon className="size-5" style={{ color: '#37656b' }} />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-5" style={{ color: '#70787a' }}>
                    {action.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Recent Creations ───────────────────────────────────── */}
      <section
        className="rounded-[1.5rem] p-6 sm:p-7"
        style={{
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}
          >
            Recent Creations
          </h2>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: '#37656b' }}
          >
            View All
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Start New card */}
          <Link
            href="/elements"
            className="group flex flex-col items-center justify-center gap-3 rounded-[1.25rem] py-10 text-center transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: '#f4f3f3',
              border: '1.5px dashed rgba(192,200,201,0.6)',
            }}
          >
            <span
              className="flex size-12 items-center justify-center rounded-full"
              style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.1)' }}
            >
              <WandSparkles className="size-5" style={{ color: '#37656b' }} />
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>
                Start New
              </p>
              <p className="mt-0.5 text-xs" style={{ color: '#70787a' }}>Generate clipart</p>
            </div>
          </Link>

          {recentCreations.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-[1.25rem] transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(55,101,107,0.06), 0 8px 20px rgba(55,101,107,0.05)',
              }}
            >
              {/* Thumbnail */}
              <div
                className="aspect-square w-full"
                style={{ background: item.bg }}
              >
                <div className="flex h-full items-center justify-center">
                  <div
                    className="size-16 rounded-full opacity-20"
                    style={{ backgroundColor: item.accent }}
                  />
                </div>
              </div>
              {/* Info */}
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-5" style={{ color: '#1a1c1c' }}>
                    {item.title}
                  </h3>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                    style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="mt-1 text-xs" style={{ color: '#70787a' }}>{item.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
