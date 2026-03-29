import { createServerClient } from '@/lib/supabase/server'
import { mapGenerationToGalleryItem } from '@/lib/gallery'
import type { IllustrationStyle } from '@/types'

function isIllustrationStyle(value: string): value is IllustrationStyle {
  return ['watercolor', 'line_art', 'cartoon', 'boho', 'minimalist'].includes(value)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const style = searchParams.get('style')
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit') || '24'), 24)
  const supabase = createServerClient()

  let query = supabase
    .from('generations')
    .select('*')
    .eq('is_public', true)
    .eq('public_approved', true)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (style && isIllustrationStyle(style)) {
    query = query.eq('style', style)
  }

  if (cursor) {
    const { data: cursorRow } = await supabase
      .from('generations')
      .select('created_at')
      .eq('id', cursor)
      .maybeSingle()

    if (cursorRow?.created_at) {
      query = query.lt('created_at', cursorRow.created_at)
    }
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const hasMore = (data?.length ?? 0) > limit
  const rows = (data ?? []).slice(0, limit)
  const items = (await Promise.all(rows.map(mapGenerationToGalleryItem))).filter(Boolean)

  return Response.json({
    items,
    next_cursor: hasMore ? rows[rows.length - 1]?.id ?? null : null,
  })
}
