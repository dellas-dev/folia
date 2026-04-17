import Link from 'next/link'
import { Clock3, Sparkles } from 'lucide-react'

type PagePlaceholderProps = {
  eyebrow: string
  title: string
  description: string
  phaseLabel?: string
}

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  phaseLabel,
}: PagePlaceholderProps) {
  return (
    <section
      className="rounded-[1.5rem] p-8"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
      }}
    >
      <div className="flex max-w-2xl flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}
          >
            <Sparkles className="size-3.5" />
            {eyebrow}
          </span>
          {phaseLabel ? (
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: '#eeeeee', color: '#70787a' }}
            >
              <Clock3 className="size-3.5" />
              {phaseLabel}
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          <h1
            className="text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.025em' }}
          >
            {title}
          </h1>
          <p className="max-w-xl text-base leading-7 sm:text-lg" style={{ color: '#70787a' }}>
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #37656b, #507e84)' }}
          >
            Back to dashboard
          </Link>
          <Link
            href="/settings/billing"
            className="inline-flex h-11 items-center justify-center rounded-full border px-6 text-sm font-semibold transition-colors hover:bg-[#f4f3f3]"
            style={{ borderColor: 'rgba(192,200,201,0.5)', color: '#404849' }}
          >
            View plans
          </Link>
        </div>
      </div>
    </section>
  )
}
