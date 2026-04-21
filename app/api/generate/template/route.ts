import { getCurrentProfile } from '@/lib/clerk/auth'
import { generateSceneBackground } from '@/lib/fal/backgrounds'
import { getFalMissingEnv, isFalNetworkError } from '@/lib/fal/client'
import { analyzeDesignForBackground } from '@/lib/gemini/enhancer'
import { getPlanForTier } from '@/lib/plans'
import { compositeTemplateOnly } from '@/lib/perspective/warp'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'
import { enforceGenerationRateLimit } from '@/lib/upstash/ratelimit'
import type { Database } from '@/types/database.types'
import { MOCKUP_SCENE_OPTIONS, type MockupScenePreset } from '@/types'

const REQUIRED_TEMPLATE_ENV = [
  'CF_ACCOUNT_ID',
  'CF_R2_ACCESS_KEY_ID',
  'CF_R2_SECRET_ACCESS_KEY',
  'CF_R2_BUCKET_NAME',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

type GenerateTemplateBody = {
  invitation_r2_key?: string
  scene_preset?: MockupScenePreset
  custom_prompt?: string
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

function getTemplateMissingEnv() {
  return [
    ...getFalMissingEnv(),
    ...REQUIRED_TEMPLATE_ENV.filter((name) => !process.env[name]),
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
      return Response.json({ error: 'Scene Template requires Pro or Business.' }, { status: 403 })
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
    let body: GenerateTemplateBody
    try {
      body = await request.json() as GenerateTemplateBody
    } catch {
      return Response.json(
        { error: 'Request body must be valid JSON.' },
        { status: 400 }
      )
    }

    if (!body.invitation_r2_key) {
      return Response.json({ error: 'invitation_r2_key is required' }, { status: 422 })
    }

    if (!isOwnedR2Key(body.invitation_r2_key, user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const missingEnv = getTemplateMissingEnv()
    if (missingEnv.length > 0) {
      return Response.json(
        { error: `Scene Template is not configured. Missing env: ${missingEnv.join(', ')}` },
        { status: 500 }
      )
    }

    const plan = getPlanForTier(profile.tier)
    const generationStartedAt = Date.now()

    // ── Phase 1: Fetch design from R2 ────────────────────────────────────
    console.log('[template] Phase 1: fetching design from R2')
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
    console.log('[template] Phase 1 OK — size:', invitationBuffer.length, 'mime:', invitationMimeType)

    // ── Phase 2: Groq Vision analyzes design → background prompt ─────────
    console.log('[template] Phase 2: Groq vision analysis')
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
    console.log('[template] Phase 2 OK — prompt:', backgroundPrompt)

    // ── Phase 3: Flux Schnell generates background ───────────────────────
    console.log('[template] Phase 3: Fal background generation')
    let bgBuffer: Buffer
    try {
      const bgImage = await generateSceneBackground(backgroundPrompt)
      bgBuffer = bgImage.buffer
    } catch (error) {
      throw phaseError('Phase 3 failed generating the template background', error)
    }
    console.log('[template] Phase 3 OK — bg size:', bgBuffer.length)

    // ── Phase 4: Composite white paper placeholder onto background ────────
    console.log('[template] Phase 4: compositing template')
    let composited: Buffer
    try {
      composited = await compositeTemplateOnly(
        invitationBuffer,
        bgBuffer,
        body.scene_preset,
      )
    } catch (error) {
      throw phaseError('Phase 4 failed compositing the template placeholder', error)
    }
    console.log('[template] Phase 4 OK — composited size:', composited.length)

    // ── Phase 5: Upload result ────────────────────────────────────────────
    console.log('[template] Phase 5: uploading to R2')
    const generationId = crypto.randomUUID()
    const r2Key = buildGenerationR2Key(user.id, generationId, 1, 'png')
    let signedUrl: string
    try {
      await uploadToR2(r2Key, composited, 'image/png')
      signedUrl = await getSignedR2Url(r2Key)
    } catch (error) {
      throw phaseError('Phase 5 failed saving the generated template', error)
    }
    console.log('[template] Phase 5 OK')

    // ── Phase 6: Deduct credit + log ──────────────────────────────────────
    console.log('[template] Phase 6: Supabase insert + credit deduct')
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
      model_used: 'template-scene-v1',
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
      throw phaseError('Phase 6 failed recording the generation', error)
    }

    return Response.json({
      generation_id: generationId,
      result: { r2_key: r2Key, signed_url: signedUrl },
      scene_prompt_used: backgroundPrompt,
      credits_remaining: creditsRemaining,
    })

  } catch (error) {
    console.error('[generate/template] ERROR:', error)

    if (isFalNetworkError(error)) {
      return Response.json(
        { error: 'Scene generation service is temporarily unreachable. Please try again in a moment.' },
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

    const message = error instanceof Error ? error.message : 'Scene Template generation failed. Please try again.'
    return Response.json({ error: message }, { status: 500 })
  }
}
