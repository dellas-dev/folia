import type { Metadata } from 'next'
import Link from 'next/link'

import { GenerationCounter } from '@/components/marketing/generation-counter'
import { marketingCopy } from '@/lib/marketing/copy'
import { getMarketingLocale } from '@/lib/marketing/locale'
import { createServerClient } from '@/lib/supabase/server'
import { isGalleryItemData, mapGenerationToGalleryItem } from '@/lib/gallery'
import type { IllustrationStyle } from '@/types'
import { STYLE_OPTIONS } from '@/types'

type CommunityPageProps = {
  searchParams: Promise<{
    style?: string
  }>
}

export const metadata: Metadata = {
  title: 'Community Gallery | Folia',
  description:
    'Browse public Folia creations across watercolor, line art, cartoon, boho, and minimalist styles.',
}

function isIllustrationStyle(value: string): value is IllustrationStyle {
  return ['watercolor', 'line_art', 'cartoon', 'boho', 'minimalist'].includes(value)
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams
  const style = params.style && isIllustrationStyle(params.style) ? params.style : undefined
  const locale = await getMarketingLocale()
  const copy = marketingCopy[locale].community
  const supabase = createServerClient()

  let query = supabase
    .from('generations')
    .select('*')
    .eq('is_public', true)
    .eq('public_approved', true)
    .order('created_at', { ascending: false })
    .limit(18)

  if (style) {
    query = query.eq('style', style)
  }

  const { data } = await query
  const items = (await Promise.all((data ?? []).map(mapGenerationToGalleryItem))).filter(isGalleryItemData)
  const selectedStyle = style ? STYLE_OPTIONS.find((option) => option.id === style) : null

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
      <section className="relative overflow-hidden rounded-[2.2rem] p-8 text-center lg:p-12" style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 40px -10px rgba(55,101,107,0.07)' }}>
        <div className="absolute inset-x-0 top-0 h-44" style={{ background: 'radial-gradient(circle at top left, rgba(55,101,107,0.07), transparent 44%), radial-gradient(circle at top right, rgba(80,126,132,0.04), transparent 28%)' }} />
        <div className="relative space-y-4">
          <p className="text-xs uppercase tracking-[0.28em]" style={{ color: '#70787a' }}>{copy.eyebrow}</p>
          <h1 className="brand-display text-5xl font-semibold lg:text-6xl" style={{ color: '#1a1c1c' }}>{copy.pageTitle}</h1>
          <p className="mx-auto max-w-3xl text-base leading-8" style={{ color: '#70787a' }}>
            {copy.pageBody}
          </p>
          <div className="grid gap-3 pt-3 lg:grid-cols-3">
            <div className="rounded-[1.6rem] px-4 py-4 text-left" style={{ backgroundColor: '#f4f3f3' }}>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>What you see</p>
              <p className="mt-2 text-sm font-medium" style={{ color: '#1a1c1c' }}>A curated stream of public Folia generations approved for community browsing.</p>
            </div>
            <div className="rounded-[1.6rem] px-4 py-4 text-left" style={{ backgroundColor: '#f4f3f3' }}>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>Why it matters</p>
              <p className="mt-2 text-sm font-medium" style={{ color: '#1a1c1c' }}>Creators can preview style directions and storefront-ready output quality before committing.</p>
            </div>
            <div className="rounded-[1.6rem] px-4 py-4 text-left" style={{ backgroundColor: '#f4f3f3' }}>
              <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#70787a' }}>Current focus</p>
              <p className="mt-2 text-sm font-medium" style={{ color: '#1a1c1c' }}>{selectedStyle ? `${selectedStyle.label} outputs and related styles` : 'All public Folia styles and creator directions'}</p>
            </div>
          </div>
        </div>
      </section>

      <GenerationCounter />

      <section className="rounded-[2rem] p-5" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.22em]" style={{ color: '#70787a' }}>Browse by style</p>
            <p className="mt-1 text-sm" style={{ color: '#70787a' }}>Filter the public gallery to one visual direction or browse everything at once.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[{ id: null, label: copy.allStyles }, ...STYLE_OPTIONS].map((option) => {
            const isActive = !style && option.id === null || style === option.id
            return (
              <Link
                key={option.id ?? 'all'}
                href={option.id ? `/community?style=${option.id}` : '/community'}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={isActive
                  ? { backgroundColor: '#37656b', color: '#ffffff' }
                  : { backgroundColor: '#eeeeee', color: '#404849' }
                }
              >
                {option.label}
              </Link>
            )
          })}
        </div>
      </section>

      {items.length === 0 ? (
        <section className="rounded-[2rem] p-10 text-center" style={{ backgroundColor: '#f4f3f3', boxShadow: '0 2px 8px rgba(55,101,107,0.05)' }}>
          <h2 className="text-3xl font-semibold" style={{ color: '#1a1c1c' }}>{copy.emptyTitle}</h2>
          <p className="mt-3 text-sm leading-7" style={{ color: '#70787a' }}>{copy.emptyBody}</p>
        </section>
      ) : (
        <section className="columns-1 gap-5 space-y-5 lg:columns-3">
          {items.map((item) => (
            <article key={item.id} className="break-inside-avoid overflow-hidden rounded-[1.8rem]" style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(55,101,107,0.06), 0 8px 24px rgba(55,101,107,0.04)' }}>
              <div className="p-4" style={{ backgroundColor: '#f4f3f3' }}>
                <img src={item.signed_url} alt="Public Folia generation" className="h-auto w-full rounded-[1.25rem] object-cover" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em]" style={{ color: '#70787a' }}>{item.type}</p>
                    <h3 className="mt-1 text-lg font-semibold capitalize" style={{ color: '#1a1c1c', fontFamily: 'var(--font-heading)' }}>{item.style ? item.style.replace('_', ' ') : 'Mockup'}</h3>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]" style={{ backgroundColor: '#d1e3e6', color: '#37656b' }}>Public</span>
                </div>
                <p className="mt-3 text-sm leading-6" style={{ color: '#70787a' }}>
                  Public Folia output suitable for storefront inspiration, style comparison, and community proof.
                </p>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="rounded-[2rem] p-8 text-center lg:p-10" style={{ backgroundColor: '#1d3a3f', boxShadow: '0 4px 20px rgba(29,58,63,0.2)' }}>
        <h2 className="text-3xl font-semibold" style={{ color: '#ffffff', fontFamily: 'var(--font-heading)' }}>{copy.ctaTitle}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7" style={{ color: 'rgba(255,255,255,0.65)' }}>{copy.ctaBody}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/sign-up" className="inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-bold text-white transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #37656b, #507e84)', boxShadow: '0 4px 14px rgba(55,101,107,0.3)' }}>{copy.ctaPrimary}</Link>
          <Link href="/pricing" className="inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-bold transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}>{copy.ctaSecondary}</Link>
        </div>
      </section>
    </div>
  )
}
