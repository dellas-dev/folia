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

  if (currentType !== 'all') {
    query = query.eq('type', currentType)
  }

  if (currentStyle !== 'all') {
    query = query.eq('style', currentStyle)
  }

  const { data } = await query
  const retainedRows = (data ?? []).filter((generation) => isGenerationWithinRetention(generation, profile.tier))
  const items = (await Promise.all(retainedRows.map(mapGenerationToGalleryItem))).filter(isGalleryItemData)

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Personal gallery</p>
        <h1 className="mt-2 text-5xl font-semibold text-foreground">Re-download, filter, and publish your best generations.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-8 text-muted-foreground">
          Retention is enforced by tier: 30 days on Starter, 90 days on Pro, and unlimited on Business. Public publishing toggles from this gallery feed the community showcase.
        </p>
      </section>

      <GalleryFilters currentType={currentType} currentStyle={currentStyle} />

      <GalleryGrid
        items={items}
        emptyTitle="No gallery items match this filter yet."
        emptyDescription="Generate an element or mockup first, then return here to re-download it or make it public."
      />
    </div>
  )
}
