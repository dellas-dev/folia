import { getCurrentProfile } from '@/lib/clerk/auth'
import { generateSceneBackground } from '@/lib/fal/backgrounds'
import { getFalMissingEnv, isFalNetworkError } from '@/lib/fal/client'
import { analyzeDesignForBackground } from '@/lib/gemini/enhancer'
import { getPlanForTier } from '@/lib/plans'
import { compositeDesignCentered, detectColorTemperature } from '@/lib/perspective/warp'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'
import { enforceGenerationRateLimit } from '@/lib/upstash/ratelimit'
import type { Database } from '@/types/database.types'
import { MOCKUP_SCENE_OPTIONS, type MockupScenePreset } from '@/types'

type GenerateMockupBody = {
  invitation_r2_key?: string
  scene_preset?: MockupScenePreset
  custom_prompt?: string
}

function getSceneLabel(preset: MockupScenePreset): string | undefined {
  return MOCKUP_SCENE_OPTIONS.find((s) => s.id === preset)?.label
}

export async function POST(request: Request) {
  const { user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (profile.tier !== 'pro' && profile.tier !== 'business') {
    return Response.json({ error: 'Mockup generation requires Pro or Business.' }, { status: 403 })
  }

  if (profile.credits < 1) {
    return Response.json({ error: 'Not enough credits. Please top up or subscribe.' }, { status: 403 })
  }

  const rateLimit = await enforceGenerationRateLimit(`${user.id}:mockup`)

  if (!rateLimit.success) {
    return Response.json(
      { error: 'Too many generation requests. Please wait a moment and try again.' },
      { status: 429 }
    )
  }

  const body = await request.json() as GenerateMockupBody

  if (!body.invitation_r2_key) {
    return Response.json({ error: 'invitation_r2_key is required' }, { status: 422 })
  }

  if (!isOwnedR2Key(body.invitation_r2_key, user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const missingEnv = getFalMissingEnv()
  if (missingEnv.length > 0) {
    return Response.json(
      { error: `Mockup generation is not configured. Missing env: ${missingEnv.join(', ')}` },
      { status: 500 }
    )
  }

  const plan = getPlanForTier(profile.tier)
  const generationStartedAt = Date.now()

  try {
    // ── Phase 1: Fetch design from R2 ────────────────────────────────────
    const invitationSignedUrl = await getSignedR2Url(body.invitation_r2_key, 300)
    const invitationRes = await fetch(invitationSignedUrl)
    if (!invitationRes.ok) throw new Error('Failed to load design image.')

    const invitationBuffer = Buffer.from(await invitationRes.arrayBuffer())
    const invitationBase64 = invitationBuffer.toString('base64')
    const invitationMimeType = invitationRes.headers.get('content-type') || 'image/png'

    // ── Phase 2: Groq Vision analyzes design → background prompt ─────────
    const sceneHint = body.scene_preset ? getSceneLabel(body.scene_preset) : body.custom_prompt
    const backgroundPrompt = await analyzeDesignForBackground(
      invitationBase64,
      invitationMimeType,
      sceneHint
    )

    console.log('[mockup] Phase 2 background prompt:', backgroundPrompt)

    // ── Phase 3: Flux Schnell generates background ───────────────────────
    const bgImage = await generateSceneBackground(backgroundPrompt)
    const bgRes = await fetch(bgImage.url)
    if (!bgRes.ok) throw new Error('Failed to download generated background.')
    const bgBuffer = Buffer.from(await bgRes.arrayBuffer())

    // ── Phase 4: Detect background color temperature (pixel analysis) ────
    const colorTemp = await detectColorTemperature(bgBuffer)
    console.log('[mockup] Color temperature detected:', colorTemp)

    // ── Phase 5: Composite design onto background ─────────────────────────
    const composited = await compositeDesignCentered(invitationBuffer, bgBuffer, colorTemp)

    // ── Phase 5: Upload result ────────────────────────────────────────────
    const generationId = crypto.randomUUID()
    const r2Key = buildGenerationR2Key(user.id, generationId, 1, 'png')
    await uploadToR2(r2Key, composited, 'image/png')
    const signedUrl = await getSignedR2Url(r2Key)

    // ── Phase 6: Deduct credit + log ──────────────────────────────────────
    const supabase = createServerClient()
    const creditsRemaining = profile.credits - 1

    const generationInsert: Database['public']['Tables']['generations']['Insert'] = {
      profile_id: profile.id,
      clerk_user_id: user.id,
      type: 'mockup',
      style: null,
      prompt_raw: null,
      prompt_enhanced: backgroundPrompt,
      reference_image_r2_key: null,
      invitation_r2_key: body.invitation_r2_key,
      scene_preset: body.scene_preset ?? null,
      custom_scene_prompt: body.custom_prompt ?? null,
      result_r2_keys: [r2Key],
      result_count: 1,
      model_used: 'design-to-scene-v1',
      gemini_used: true,
      generation_time_ms: Date.now() - generationStartedAt,
      resolution: plan.resolution,
      is_public: false,
      public_approved: true,
      credits_spent: 1,
    }

    const [generationResult, creditsResult] = await Promise.all([
      supabase.from('generations').insert(generationInsert),
      supabase.from('profiles').update({ credits: creditsRemaining }).eq('clerk_user_id', user.id),
    ])

    if (generationResult.error) throw generationResult.error
    if (creditsResult.error) throw creditsResult.error

    return Response.json({
      generation_id: generationId,
      result: { r2_key: r2Key, signed_url: signedUrl },
      scene_prompt_used: backgroundPrompt,
      credits_remaining: creditsRemaining,
    })
  } catch (error) {
    console.error('[generate/mockup]', error)

    if (isFalNetworkError(error)) {
      return Response.json(
        { error: 'Mockup generation service is temporarily unreachable. Please try again in a moment.' },
        { status: 503 }
      )
    }

    if (error instanceof Error && error.message === 'GROQ_RATE_LIMIT') {
      return Response.json(
        { error: 'Design analysis is temporarily rate-limited. Please try again in a moment.' },
        { status: 429 }
      )
    }

    const message = error instanceof Error ? error.message : 'Mockup generation failed. Please try again.'
    return Response.json({ error: message }, { status: 500 })
  }
}
