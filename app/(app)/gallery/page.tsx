import Link from 'next/link'

import { GalleryFilters } from '@/components/app/gallery/gallery-filters'
import { GalleryGrid } from '@/components/app/gallery/gallery-grid'
import { requireCurrentProfile } from '@/lib/clerk/auth'
import { createServerClient } from '@/lib/supabase/server'
import { isGalleryItemData, isGenerationWithinRetention, mapGenerationToGalleryItem } from '@/lib/gallery'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
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

  if (currentType !== 'all') {
    query = query.eq('type', currentType)
  }

  if (currentStyle !== 'all') {
    query = query.eq('style', currentStyle)
  }

  const { data } = await query
  const retainedRows = (data ?? []).filter((generation) => isGenerationWithinRetention(generation, profile.tier))
  const items = (await Promise.all(retainedRows.map(mapGenerationToGalleryItem))).filter(isGalleryItemData)

  const isFiltered = currentType !== 'all' || currentStyle !== 'all'

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Personal gallery</p>
            <h1 className="mt-2 text-4xl font-semibold text-foreground">Your generations</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Re-download, filter, and publish your best work. Retention: 30 days on Starter · 90 days on Pro · Unlimited on Business.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {isFiltered ? 'Filtered' : 'Total'}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{items.length}</p>
            </div>
            <Link href="/elements" className={cn(buttonVariants({ size: 'lg' }))}>
              Generate new
            </Link>
          </div>
        </div>
      </section>

      <GalleryFilters currentType={currentType} currentStyle={currentStyle} />

      <GalleryGrid items={items} isFiltered={isFiltered} />
    </div>
  )
}
