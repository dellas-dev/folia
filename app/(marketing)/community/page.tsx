import type { Metadata } from 'next'
import Link from 'next/link'

import { GenerationCounter } from '@/components/marketing/generation-counter'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <section className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Community gallery</p>
        <h1 className="text-5xl font-semibold text-foreground">Browse public Folia creations.</h1>
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          This is the public showcase route for now while `/gallery` stays protected for personal history. Visitors can explore styles and sign up to create their own.
        </p>
      </section>

      <GenerationCounter />

      <section className="flex flex-wrap justify-center gap-2">
        <Link href="/community" className={cn(buttonVariants({ variant: !style ? 'default' : 'outline', size: 'sm' }))}>
          All styles
        </Link>
        {STYLE_OPTIONS.map((option) => (
          <Link
            key={option.id}
            href={`/community?style=${option.id}`}
            className={cn(buttonVariants({ variant: style === option.id ? 'default' : 'outline', size: 'sm' }))}
          >
            {option.label}
          </Link>
        ))}
      </section>

      {items.length === 0 ? (
        <section className="rounded-[1.8rem] border border-dashed border-border/70 bg-card/70 p-10 text-center">
          <h2 className="text-3xl font-semibold text-foreground">No public creations yet.</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Generated artwork appears here as soon as users opt in from their personal gallery.</p>
        </section>
      ) : (
        <section className="columns-1 gap-5 space-y-5 lg:columns-3">
          {items.map((item) => (
            <article key={item.id} className="break-inside-avoid overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-sm shadow-black/5">
              <div className="bg-[linear-gradient(135deg,oklch(0.97_0.01_84),oklch(0.93_0.03_145))] p-4">
                <img src={item.signed_url} alt="Public Folia generation" className="h-auto w-full rounded-[1.2rem] object-cover" />
              </div>
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.type}</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{item.style ? item.style.replace('_', ' ') : 'Mockup'}</h3>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="rounded-[1.8rem] border border-border/70 bg-card/90 p-8 text-center shadow-sm shadow-black/5">
        <h2 className="text-3xl font-semibold text-foreground">Create your own commercial-ready artwork.</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">Start with clipart elements, then move into invitation mockups as your catalog grows.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>Create account</Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>View pricing</Link>
        </div>
      </section>
    </div>
  )
}
