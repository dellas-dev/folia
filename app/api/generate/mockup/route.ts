import { getCurrentProfile } from '@/lib/clerk/auth'
import { getFalMissingEnv, isFalNetworkError } from '@/lib/fal/client'
import { generateMockupImage } from '@/lib/fal/mockups'
import { analyzeInvitationForMockup } from '@/lib/gemini/enhancer'
import { getPlanForTier } from '@/lib/plans'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'
import { enforceGenerationRateLimit } from '@/lib/upstash/ratelimit'
import type { Database } from '@/types/database.types'
import { MOCKUP_SCENE_PROMPTS, type MockupScenePreset } from '@/types'

type GenerateMockupBody = {
  invitation_r2_key?: string
  scene_preset?: MockupScenePreset
  custom_prompt?: string
}

function isScenePreset(value: string): value is MockupScenePreset {
  return value in MOCKUP_SCENE_PROMPTS
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

  const scenePreset = body.scene_preset
  const customPrompt = body.custom_prompt?.trim()

  if (scenePreset && !isScenePreset(scenePreset)) {
    return Response.json({ error: 'Invalid scene preset' }, { status: 422 })
  }

  const plan = getPlanForTier(profile.tier)
  const missingEnv = getFalMissingEnv()

  if (missingEnv.length > 0) {
    return Response.json(
      { error: `Mockup generation is not configured. Missing env: ${missingEnv.join(', ')}` },
      { status: 500 }
    )
  }

  try {
    const invitationSignedUrl = await getSignedR2Url(body.invitation_r2_key, 300)

    let finalScenePrompt: string
    let geminiUsed = false

    if (scenePreset) {
      // Preset mode — use preset prompt directly, Gemini skipped
      finalScenePrompt = MOCKUP_SCENE_PROMPTS[scenePreset]
    } else {
      // AUTO mode — Gemini reads invitation and generates matching scene
      const imageResponse = await fetch(invitationSignedUrl)

      if (!imageResponse.ok) {
        throw new Error('Failed to load invitation image for analysis.')
      }

      const invitationBase64 = Buffer.from(await imageResponse.arrayBuffer()).toString('base64')
      const invitationMimeType = imageResponse.headers.get('content-type') || 'image/png'

      finalScenePrompt = await analyzeInvitationForMockup(
        invitationBase64,
        invitationMimeType,
        customPrompt
      )
      geminiUsed = true
    }

    const generationStartedAt = Date.now()
    const image = await generateMockupImage({
      prompt: finalScenePrompt,
      invitationImageUrl: invitationSignedUrl,
    })

    const generationId = crypto.randomUUID()
    const imageResponse = await fetch(image.url)

    if (!imageResponse.ok) {
      throw new Error('Failed to download generated mockup image from Fal.ai.')
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer())
    const contentType = imageResponse.headers.get('content-type') || image.content_type || 'image/png'
    const r2Key = buildGenerationR2Key(user.id, generationId, 1)

    await uploadToR2(r2Key, buffer, contentType)
    const signedUrl = await getSignedR2Url(r2Key)

    const supabase = createServerClient()
    const generationInsert: Database['public']['Tables']['generations']['Insert'] = {
      profile_id: profile.id,
      clerk_user_id: user.id,
      type: 'mockup',
      style: null,
      prompt_raw: null,
      prompt_enhanced: finalScenePrompt,
      reference_image_r2_key: null,
      invitation_r2_key: body.invitation_r2_key,
      scene_preset: scenePreset ?? null,
      custom_scene_prompt: customPrompt ?? null,
      result_r2_keys: [r2Key],
      result_count: 1,
      model_used: 'fal-ai/flux-pro/kontext',
      gemini_used: geminiUsed,
      generation_time_ms: Date.now() - generationStartedAt,
      resolution: plan.resolution,
      is_public: false,
      public_approved: true,
      credits_spent: 1,
    }

    const { error: generationError } = await supabase.from('generations').insert(generationInsert)

    if (generationError) throw generationError

    const creditsRemaining = profile.credits - 1
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ credits: creditsRemaining })
      .eq('clerk_user_id', user.id)

    if (profileError) throw profileError

    return Response.json({
      generation_id: generationId,
      result: {
        r2_key: r2Key,
        signed_url: signedUrl,
      },
      scene_prompt_used: finalScenePrompt,
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

    const message = error instanceof Error ? error.message : 'Mockup generation failed. Please try again.'

    return Response.json({ error: message }, { status: 500 })
  }
}
