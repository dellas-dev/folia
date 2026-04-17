import { Search } from 'lucide-react'

import { GalleryFilters } from '@/components/app/gallery/gallery-filters'
import { GalleryGrid } from '@/components/app/gallery/gallery-grid'
import { requireCurrentProfile } from '@/lib/clerk/auth'
import { createServerClient } from '@/lib/supabase/server'
import { isGalleryItemData, isGenerationWithinRetention, mapGenerationToGalleryItem } from '@/lib/gallery'
import type { IllustrationStyle } from '@/types'

type GalleryPageProps = {
  searchParams: Promise<{
    type?: 'all' | 'element' | 'mockup'
    style?: IllustrationStyle | 'all'
  }>
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams
  const { user, profile } = await requireCurrentProfile()
  const currentType = params.type ?? 'all'
  const currentStyle = params.style ?? 'all'
  const supabase = createServerClient()

  let query = supabase
    .from('generations')
    .select('*')
    .eq('clerk_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60)

  if (currentType !== 'all') query = query.eq('type', currentType)
  if (currentStyle !== 'all') query = query.eq('style', currentStyle)

  const { data } = await query
  const retainedRows = (data ?? []).filter((generation) => isGenerationWithinRetention(generation, profile.tier))
  const items = (await Promise.all(retainedRows.map(mapGenerationToGalleryItem))).filter(isGalleryItemData)

  const elementCount = items.filter((i) => i.type === 'element').length
  const mockupCount  = items.filter((i) => i.type === 'mockup').length

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <section
        className="rounded-[1.5rem] p-6"
        style={{
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(55,101,107,0.05), 0 12px 32px rgba(55,101,107,0.05)',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#70787a' }}>
              Folia Gallery
            </p>
            <h1
              className="mt-1 text-3xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: '#1a1c1c', letterSpacing: '-0.02em' }}
            >
              My Gallery
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: '#70787a' }}>
                {elementCount} Elements
              </span>
              <span style={{ color: '#c0c8c9' }}>·</span>
              <span className="text-sm font-medium" style={{ color: '#70787a' }}>
                {mockupCount} Mockups
              </span>
            </div>
          </div>

          {/* Search + sort */}
          <div className="flex flex-1 items-center gap-3 sm:justify-end">
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                style={{ color: '#c0c8c9' }}
              />
              <input
                readOnly
                placeholder="Search creations..."
                className="h-10 w-full rounded-full pl-10 pr-4 text-sm outline-none"
                style={{
                  backgroundColor: '#f4f3f3',
                  color: '#1a1c1c',
                  border: '1.5px solid transparent',
                }}
              />
            </div>
            <span
              className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold"
              style={{ backgroundColor: '#f4f3f3', color: '#404849' }}
            >
              Newest First
            </span>
          </div>
        </div>
      </section>

      {/* ── Filters ─────────────────────────────────────────── */}
      <GalleryFilters currentType={currentType} currentStyle={currentStyle} />

      {/* ── Grid ────────────────────────────────────────────── */}
      <GalleryGrid
        items={items}
        emptyTitle={currentType !== 'all' || currentStyle !== 'all' ? 'No results match this filter.' : 'No generations yet.'}
        emptyDescription={
          currentType !== 'all' || currentStyle !== 'all'
            ? 'Try selecting a different style or type filter above.'
            : 'Head to Elements or Mockups to generate your first clipart.'
        }
      />
    </div>
  )
}
