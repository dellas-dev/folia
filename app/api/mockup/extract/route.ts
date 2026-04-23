import { getCurrentProfile } from '@/lib/clerk/auth'
import { analyzeExtractSurfaceVision } from '@/lib/gemini/detector'
import { enhanceExtractReference } from '@/lib/mockup/compositing'
import { buildVisualValidationError } from '@/lib/mockup/request'
import { getPlanForTier } from '@/lib/plans'
import { cleanExtractedSurface, extractSurface, prepareReference } from '@/lib/perspective/warp'
import { buildExtractedR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'
import { enforceGenerationRateLimit } from '@/lib/upstash/ratelimit'
import type { Database } from '@/types/database.types'
import sharp from 'sharp'

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

    // ── Fetch reference, analyze surface, rectify, then clean/inpaint the old design ──
    const referenceSignedUrl = await getSignedR2Url(referenceR2Key, 300)
    const referenceRes = await fetch(referenceSignedUrl)
    if (!referenceRes.ok) {
      throw new Error(`Failed to fetch reference image: ${referenceRes.status} ${referenceRes.statusText}`)
    }

    const referenceBuffer = Buffer.from(await referenceRes.arrayBuffer())
    const referenceMeta = await sharp(referenceBuffer).metadata()
    const { resizedBuffer: referenceForDetection, width: refW, height: refH } = await prepareReference(referenceBuffer)
    const vision = await analyzeExtractSurfaceVision(referenceForDetection.toString('base64'), 'image/jpeg', refW, refH)
    const points = [
      vision.corners.topLeft,
      vision.corners.topRight,
      vision.corners.bottomRight,
      vision.corners.bottomLeft,
    ]
    const extractedSurface = await extractSurface(referenceForDetection, points, { neutralize: false })
    const cleanedSurface = await cleanExtractedSurface(extractedSurface.buffer, {
      materialTexture: vision.materialTexture,
      lightingDirection: vision.lightingDirection,
    })
    const enhancedSurface = await enhanceExtractReference(cleanedSurface.buffer, plan.resolution)

    const generationId = crypto.randomUUID()
    const r2Key = buildExtractedR2Key(user.id, generationId, 'png')
    await uploadToR2(r2Key, enhancedSurface.buffer, 'image/png')
    const signedUrl = await getSignedR2Url(r2Key, 3600)

    // ── Log generation + deduct credit ────────────────────────────────────
    const supabase = createServerClient()
    const creditsRemaining = profile.credits - 1

    const generationInsert: Database['public']['Tables']['generations']['Insert'] = {
      profile_id: profile.id,
      clerk_user_id: user.id,
      type: 'mockup',
      style: null,
      prompt_raw: JSON.stringify({
        material_texture: vision.materialTexture,
        lighting_direction: vision.lightingDirection,
        analysis_raw: vision.raw || null,
      }),
      prompt_enhanced: null,
      reference_image_r2_key: referenceR2Key,
      invitation_r2_key: null,
      scene_preset: null,
      custom_scene_prompt: `extract-clean:${vision.materialTexture}; lighting:${vision.lightingDirection}`,
      result_r2_keys: [r2Key],
      result_count: 1,
      model_used: 'extract-surface-clean-v3',
      gemini_used: true,
      generation_time_ms: Date.now() - generationStartedAt,
      resolution: Math.max(enhancedSurface.width, enhancedSurface.height),
      is_public: false,
      public_approved: true,
      credits_spent: 1,
    }

    const extractedTemplateInsert: Database['public']['Tables']['extracted_templates']['Insert'] = {
      profile_id: profile.id,
      clerk_user_id: user.id,
      reference_r2_key: referenceR2Key,
      extracted_r2_key: r2Key,
      corner_coordinates: [
        vision.corners.topLeft,
        vision.corners.topRight,
        vision.corners.bottomRight,
        vision.corners.bottomLeft,
      ],
      detected_material: vision.materialTexture,
      aspect_ratio: enhancedSurface.height > 0 ? enhancedSurface.width / enhancedSurface.height : null,
      original_width: referenceMeta.width ?? null,
      original_height: referenceMeta.height ?? null,
      extracted_width: enhancedSurface.width,
      extracted_height: enhancedSurface.height,
      status: 'completed',
      credits_consumed: 1,
      label: 'Untitled Template',
    }

    const [generationResult, extractedTemplateResult, creditsResult] = await Promise.all([
      supabase
        .from('generations')
        .insert(generationInsert),
      supabase
        .from('extracted_templates')
        .insert(extractedTemplateInsert),
      supabase
        .from('profiles')
        .update({ credits: creditsRemaining })
        .eq('clerk_user_id', user.id),
    ])

    if (generationResult.error) throw generationResult.error
    if (extractedTemplateResult.error) throw extractedTemplateResult.error
    if (creditsResult.error) throw creditsResult.error

    return Response.json({
      generation_id: generationId,
      result: { r2_key: r2Key, signed_url: signedUrl },
      credits_remaining: creditsRemaining,
      corners: vision.corners,
      analysis: {
        material_texture: vision.materialTexture,
        lighting_direction: vision.lightingDirection,
      },
    })

  } catch (error) {
    console.error('[mockup/extract] ERROR:', error)

    if (error instanceof Error && error.message === 'GROQ_RATE_LIMIT') {
      return Response.json(
        { error: 'Vision analysis is temporarily rate-limited. Please try again in a moment.' },
        { status: 429 }
      )
    }

    if (error instanceof Error && error.message === 'CORNER_DETECTION_FAILED') {
      return Response.json(
        { error: 'Could not detect the main paper or canvas surface in the reference image. Try a clearer photo with the full surface visible.' },
        { status: 422 }
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
