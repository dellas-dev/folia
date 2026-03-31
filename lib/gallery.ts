import type { Database } from '@/types/database.types'

import { getSignedR2Url } from '@/lib/r2/client'
import { getPlanForTier } from '@/lib/plans'
import type { IllustrationStyle, GenerationType, UserTier } from '@/types'

export type GenerationRow = Database['public']['Tables']['generations']['Row']

export type GalleryItemData = {
  id: string
  type: GenerationType
  style: IllustrationStyle | null
  prompt_raw: string | null
  created_at: string
  signed_url: string
  result_r2_key: string
  is_public: boolean
  scene_preset: string | null
}

export async function mapGenerationToGalleryItem(generation: GenerationRow): Promise<GalleryItemData | null> {
  const resultKey = generation.result_r2_keys[0]

  if (!resultKey) {
    return null
  }

  return {
    id: generation.id,
    type: generation.type,
    style: generation.style,
    prompt_raw: generation.prompt_raw,
    created_at: generation.created_at,
    signed_url: await getSignedR2Url(resultKey),
    result_r2_key: resultKey,
    is_public: generation.is_public,
    scene_preset: generation.scene_preset,
  }
}

export function isGenerationWithinRetention(generation: GenerationRow, tier: UserTier) {
  const retentionDays = getPlanForTier(tier).gallery_retention_days

  if (retentionDays < 0) {
    return true
  }

  const ageMs = Date.now() - new Date(generation.created_at).getTime()
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000

  return ageMs <= retentionMs
}

export function isGalleryItemData(item: GalleryItemData | null): item is GalleryItemData {
  return item !== null
}
