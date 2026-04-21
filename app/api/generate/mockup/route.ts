import { getCurrentProfile } from '@/lib/clerk/auth'
import { generateSceneBackground } from '@/lib/fal/backgrounds'
import { getFalMissingEnv, isFalNetworkError } from '@/lib/fal/client'
import { analyzeDesignForBackground } from '@/lib/gemini/enhancer'
import { parseMockupSigmaInput } from '@/lib/mockup/sigma'
import { getPlanForTier } from '@/lib/plans'
import { compositeDesignCentered, detectColorTemperature } from '@/lib/perspective/warp'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'
import { enforceGenerationRateLimit } from '@/lib/upstash/ratelimit'
import type { Database } from '@/types/database.types'
import { MOCKUP_SCENE_OPTIONS, type MockupScenePreset } from '@/types'

const REQUIRED_MOCKUP_ENV = [
  'CF_ACCOUNT_ID',
  'CF_R2_ACCESS_KEY_ID',
  'CF_R2_SECRET_ACCESS_KEY',
  'CF_R2_BUCKET_NAME',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

type GenerateMockupBody = {
  invitation_r2_key?: string
  scene_preset?: MockupScenePreset
  custom_prompt?: string
  sigma?: unknown
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

function phaseError(phase: string, error: unknown) {
  return new Error(`${phase}: ${getErrorMessage(error)}`)
}

function getSceneOption(preset: MockupScenePreset) {
  return MOCKUP_SCENE_OPTIONS.find((scene) => scene.id === preset)
}

function getMockupMissingEnv() {
  return [
    ...getFalMissingEnv(),
    ...REQUIRED_MOCKUP_ENV.filter((name) => !process.env[name]),
  ]
}

export async function POST(request: Request) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────
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

    // ── Rate limit ────────────────────────────────────────────────────────
    const rateLimit = await enforceGenerationRateLimit(`${user.id}:mockup`)

    if (!rateLimit.success) {
      return Response.json(
        { error: 'Too many generation requests. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    // ── Parse body ────────────────────────────────────────────────────────
    let body: GenerateMockupBody
    try {
      body = await request.json() as GenerateMockupBody
    } catch {
      return Response.json(
        { error: 'Request body must be valid JSON.' },
        { status: 400 }
      )
    }

    if (!body.invitation_r2_key) {
      return Response.json({ error: 'invitation_r2_key is required' }, { status: 422 })
    }

    const sigmaResult = parseMockupSigmaInput(body.sigma)
    if (!sigmaResult.ok) {
      return Response.json(
        { error: sigmaResult.error, field: 'sigma' },
        { status: 422 }
      )
    }

    if (!isOwnedR2Key(body.invitation_r2_key, user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const missingEnv = getMockupMissingEnv()
    if (missingEnv.length > 0) {
      return Response.json(
        { error: `Mockup generation is not configured. Missing env: ${missingEnv.join(', ')}` },
        { status: 500 }
      )
    }

    const plan = getPlanForTier(profile.tier)
    const generationStartedAt = Date.now()

    // ── Phase 1: Fetch design from R2 ────────────────────────────────────
    console.log('[mockup] Phase 1: fetching design from R2')
    let invitationBuffer: Buffer
    let invitationBase64: string
    let invitationMimeType: string
    try {
      const invitationSignedUrl = await getSignedR2Url(body.invitation_r2_key, 300)
      const invitationRes = await fetch(invitationSignedUrl)
      if (!invitationRes.ok) {
        throw new Error(`R2 fetch ${invitationRes.status} ${invitationRes.statusText}`)
      }

      invitationBuffer = Buffer.from(await invitationRes.arrayBuffer())
      invitationBase64 = invitationBuffer.toString('base64')
      invitationMimeType = invitationRes.headers.get('content-type') || 'image/png'
    } catch (error) {
      throw phaseError('Phase 1 failed loading the uploaded invitation', error)
    }
    console.log('[mockup] Phase 1 OK — size:', invitationBuffer.length, 'mime:', invitationMimeType)

    // ── Phase 2: Groq Vision analyzes design → background prompt ─────────
    console.log('[mockup] Phase 2: Groq vision analysis')
    const sceneOption = body.scene_preset ? getSceneOption(body.scene_preset) : undefined
    let backgroundPrompt: string
    try {
      backgroundPrompt = await analyzeDesignForBackground(
        invitationBase64,
        invitationMimeType,
        {
          sceneLabel: sceneOption?.label,
          scenePrompt: sceneOption?.prompt,
          customPrompt: body.custom_prompt,
        }
      )
    } catch (error) {
      throw phaseError('Phase 2 failed generating the background prompt', error)
    }
    console.log('[mockup] Phase 2 OK — prompt:', backgroundPrompt)

    // ── Phase 3: Flux Schnell generates background ───────────────────────
    console.log('[mockup] Phase 3: Fal background generation')
    let bgBuffer: Buffer
    try {
      const bgImage = await generateSceneBackground(backgroundPrompt)
      bgBuffer = bgImage.buffer
    } catch (error) {
      throw phaseError('Phase 3 failed generating the mockup background', error)
    }
    console.log('[mockup] Phase 3 OK — bg size:', bgBuffer.length)

    // ── Phase 4: Detect background color temperature (pixel analysis) ────
    console.log('[mockup] Phase 4: color temperature detection')
    let colorTemp: 'warm' | 'cool' | 'neutral'
    try {
      colorTemp = await detectColorTemperature(bgBuffer)
    } catch (error) {
      throw phaseError('Phase 4 failed analyzing the generated background', error)
    }
    console.log('[mockup] Phase 4 OK — colorTemp:', colorTemp)

    // ── Phase 5: Composite design onto background ─────────────────────────
    console.log('[mockup] Phase 5: compositing')
    let composited: Buffer
    try {
      composited = await compositeDesignCentered(
        invitationBuffer,
        bgBuffer,
        colorTemp,
        body.scene_preset,
        sigmaResult.value
      )
    } catch (error) {
      throw phaseError('Phase 5 failed compositing the invitation onto the background', error)
    }
    console.log('[mockup] Phase 5 OK — composited size:', composited.length)

    // ── Phase 6: Upload result ────────────────────────────────────────────
    console.log('[mockup] Phase 6: uploading to R2')
    const generationId = crypto.randomUUID()
    const r2Key = buildGenerationR2Key(user.id, generationId, 1, 'png')
    let signedUrl: string
    try {
      await uploadToR2(r2Key, composited, 'image/png')
      signedUrl = await getSignedR2Url(r2Key)
    } catch (error) {
      throw phaseError('Phase 6 failed saving the generated mockup', error)
    }
    console.log('[mockup] Phase 6 OK')

    // ── Phase 7: Deduct credit + log ──────────────────────────────────────
    console.log('[mockup] Phase 7: Supabase insert + credit deduct')
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

    try {
      const { error: generationError } = await supabase
        .from('generations')
        .insert(generationInsert)

      if (generationError) throw generationError

      const { error: creditsError } = await supabase
        .from('profiles')
        .update({ credits: creditsRemaining })
        .eq('clerk_user_id', user.id)

      if (creditsError) throw creditsError
    } catch (error) {
      throw phaseError('Phase 7 failed recording the generation', error)
    }

    return Response.json({
      generation_id: generationId,
      result: { r2_key: r2Key, signed_url: signedUrl },
      scene_prompt_used: backgroundPrompt,
      credits_remaining: creditsRemaining,
    })

  } catch (error) {
    console.error('[generate/mockup] ERROR:', error)

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

    if (error instanceof Error && /unsupported image format|input buffer/i.test(error.message)) {
      return Response.json(
        { error: 'The uploaded invitation image could not be processed. Please try a PNG, JPG, or WEBP export.' },
        { status: 422 }
      )
    }

    if (error instanceof Error && /sigma must be/i.test(error.message)) {
      return Response.json(
        { error: error.message, field: 'sigma' },
        { status: 422 }
      )
    }

    const message = error instanceof Error ? error.message : 'Mockup generation failed. Please try again.'
    return Response.json({ error: message }, { status: 500 })
  }
}
