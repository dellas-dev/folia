import { getCurrentProfile } from '@/lib/clerk/auth'
import { getPlanForTier } from '@/lib/plans'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'
import { enforceGenerationRateLimit } from '@/lib/upstash/ratelimit'
import type { Database } from '@/types/database.types'

type ExtractBody = {
  reference_r2_key?: string
}

export async function POST(request: Request) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────
    const { user, profile } = await getCurrentProfile()

    if (!user || !profile) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (profile.tier !== 'pro' && profile.tier !== 'business') {
      return Response.json({ error: 'Extract Template requires Pro or Business.' }, { status: 403 })
    }

    if (profile.credits < 1) {
      return Response.json({ error: 'Not enough credits. Please top up or subscribe.' }, { status: 403 })
    }

    // ── Rate limit ────────────────────────────────────────────────────────
    const rateLimit = await enforceGenerationRateLimit(`${user.id}:mockup`)
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Too many generation requests. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    // ── Parse body ────────────────────────────────────────────────────────
    let body: ExtractBody
    try {
      body = await request.json() as ExtractBody
    } catch {
      return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }

    if (!body.reference_r2_key) {
      return Response.json({ error: 'reference_r2_key is required' }, { status: 422 })
    }

    if (!isOwnedR2Key(body.reference_r2_key, user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const plan = getPlanForTier(profile.tier)
    const generationStartedAt = Date.now()

    // ── Generate signed URL for the reference image as-is ────────────────
    const signedUrl = await getSignedR2Url(body.reference_r2_key, 3600)
    const r2Key = body.reference_r2_key

    // ── Log generation + deduct credit ────────────────────────────────────
    const supabase = createServerClient()
    const creditsRemaining = profile.credits - 1

    const generationInsert: Database['public']['Tables']['generations']['Insert'] = {
      profile_id: profile.id,
      clerk_user_id: user.id,
      type: 'mockup',
      style: null,
      prompt_raw: null,
      prompt_enhanced: null,
      reference_image_r2_key: body.reference_r2_key,
      invitation_r2_key: null,
      scene_preset: null,
      custom_scene_prompt: null,
      result_r2_keys: [r2Key],
      result_count: 1,
      model_used: 'extract-template-v1',
      gemini_used: false,
      generation_time_ms: Date.now() - generationStartedAt,
      resolution: plan.resolution,
      is_public: false,
      public_approved: true,
      credits_spent: 1,
    }

    const { error: generationError } = await supabase
      .from('generations')
      .insert(generationInsert)
    if (generationError) throw generationError

    const { error: creditsError } = await supabase
      .from('profiles')
      .update({ credits: creditsRemaining })
      .eq('clerk_user_id', user.id)
    if (creditsError) throw creditsError

    return Response.json({
      generation_id: crypto.randomUUID(),
      result: { r2_key: r2Key, signed_url: signedUrl },
      credits_remaining: creditsRemaining,
    })

  } catch (error) {
    console.error('[mockup/extract] ERROR:', error)
    const message = error instanceof Error ? error.message : 'Extract Template failed. Please try again.'
    return Response.json({ error: message }, { status: 500 })
  }
}
