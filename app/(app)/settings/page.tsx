import Link from 'next/link'
import { ArrowRight, Bell, CreditCard, Shield, UserCircle2 } from 'lucide-react'

type SettingCard = {
  title: string
  description: string
  icon: typeof UserCircle2
  href?: string
}

const settingCards: SettingCard[] = [
  {
    title: 'Profile Preferences',
    description: 'Control your workspace identity, creative defaults, and editor presence.',
    icon: UserCircle2,
  },
  {
    title: 'Billing & Credits',
    description: 'Review your credit balance and manage plan upgrades in one place.',
    icon: CreditCard,
    href: '/settings/billing',
  },
  {
    title: 'Notifications',
    description: 'Decide how Folia notifies you about generation status and workspace activity.',
    icon: Bell,
  },
  {
    title: 'Security',
    description: 'Keep your account protected with a clean and focused permission layer.',
    icon: Shield,
  },
] as const

export default function SettingsPage() {
  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
          Account
        </p>
        <h1
          className="mt-1 text-3xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}
        >
          Settings
        </h1>
      </div>

      {/* ── Setting cards ────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingCards.map((card) => {
          const Icon = card.icon
          const isLinked = !!card.href

          const content = (
            <>
              <span
                className="flex size-11 items-center justify-center rounded-full"
                style={{ backgroundColor: isLinked ? '#d1e3e6' : '#eeeeee' }}
              >
                <Icon className="size-5" style={{ color: isLinked ? '#37656b' : '#c0c8c9' }} />
              </span>
              <h2
                className="mt-4 text-base font-bold"
                style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c' }}
              >
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: '#70787a' }}>
                {card.description}
              </p>
              {isLinked ? (
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: '#37656b' }}>
                  Open section
                  <ArrowRight className="size-3.5" />
                </span>
              ) : null}
            </>
          )

          return isLinked ? (
            <Link
              key={card.title}
              href={card.href!}
              className="flex flex-col rounded-[1.25rem] p-5 transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 8px 24px rgba(55,101,107,0.05)',
              }}
            >
              {content}
            </Link>
          ) : (
            <article
              key={card.title}
              className="flex flex-col rounded-[1.25rem] p-5"
              style={{ backgroundColor: '#f4f3f3' }}
            >
              {content}
            </article>
          )
        })}
      </div>
    </div>
  )
}
