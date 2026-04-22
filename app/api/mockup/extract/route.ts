import { getCurrentProfile } from '@/lib/clerk/auth'
import { detectMockupCorners } from '@/lib/gemini/enhancer'
import { buildVisualValidationError } from '@/lib/mockup/request'
import { getPlanForTier } from '@/lib/plans'
import { extractRectifiedSurface, prepareReference } from '@/lib/perspective/warp'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
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
      return Response.json(
        buildVisualValidationError([{ field: 'reference_r2_key', message: 'reference_r2_key is required.' }], 'Invalid extract payload.'),
        { status: 422 }
      )
    }

    const referenceR2Key = body.reference_r2_key

    if (!isOwnedR2Key(referenceR2Key, user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const plan = getPlanForTier(profile.tier)
    const generationStartedAt = Date.now()

    // ── Fetch reference, detect card corners, then rectify into a large planar extract ──
    const referenceSignedUrl = await getSignedR2Url(referenceR2Key, 300)
    const referenceRes = await fetch(referenceSignedUrl)
    if (!referenceRes.ok) {
      throw new Error(`Failed to fetch reference image: ${referenceRes.status} ${referenceRes.statusText}`)
    }

    const referenceBuffer = Buffer.from(await referenceRes.arrayBuffer())
    const { resizedBuffer: referenceForDetection, width: refW, height: refH } = await prepareReference(referenceBuffer)
    const corners = await detectMockupCorners(referenceForDetection.toString('base64'), 'image/jpeg', refW, refH)
    const extractedSurface = await extractRectifiedSurface(referenceBuffer, corners, refW, refH, plan.resolution)

    const generationId = crypto.randomUUID()
    const r2Key = buildGenerationR2Key(user.id, generationId, 1, 'png')
    await uploadToR2(r2Key, extractedSurface.buffer, 'image/png')
    const signedUrl = await getSignedR2Url(r2Key, 3600)

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
      reference_image_r2_key: referenceR2Key,
      invitation_r2_key: null,
      scene_preset: null,
      custom_scene_prompt: null,
      result_r2_keys: [r2Key],
      result_count: 1,
      model_used: 'extract-template-rectify-v2',
      gemini_used: true,
      generation_time_ms: Date.now() - generationStartedAt,
      resolution: Math.max(extractedSurface.width, extractedSurface.height),
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
      generation_id: generationId,
      result: { r2_key: r2Key, signed_url: signedUrl },
      credits_remaining: creditsRemaining,
      corners,
    })

  } catch (error) {
    console.error('[mockup/extract] ERROR:', error)

    if (error instanceof Error && error.message === 'GROQ_RATE_LIMIT') {
      return Response.json(
        { error: 'Vision analysis is temporarily rate-limited. Please try again in a moment.' },
        { status: 429 }
      )
    }

    if (error instanceof Error && /reference image could not be processed|unsupported image format|input buffer/i.test(error.message)) {
      return Response.json(
        buildVisualValidationError([
          {
            field: 'reference_r2_key',
            message: 'The uploaded reference image could not be processed. Please try a sharper JPG, PNG, or WEBP file.',
          },
        ], 'Invalid extract payload.'),
        { status: 422 }
      )
    }

    const message = error instanceof Error ? error.message : 'Extract Template failed. Please try again.'
    return Response.json({ error: message }, { status: 500 })
  }
}
