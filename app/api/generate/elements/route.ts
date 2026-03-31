import { getCurrentProfile } from '@/lib/clerk/auth'
import { generateElementImages } from '@/lib/fal/elements'
import { enhancePrompt } from '@/lib/ai/enhancer'
import { PLANS } from '@/lib/plans'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'
import { enforceGenerationRateLimit } from '@/lib/upstash/ratelimit'
import type { Database } from '@/types/database.types'
import { STYLE_MODIFIERS, type IllustrationStyle, type UserTier } from '@/types'

type GenerateElementsBody = {
  style?: IllustrationStyle
  prompt?: string
  reference_image_r2_key?: string
  num_variations?: number
}

type ProfileRow = Database['public']['Tables']['profiles']['Row']

function getEffectiveTier(tier: UserTier) {
  return tier === 'pro' || tier === 'business' ? tier : 'starter'
}

function isIllustrationStyle(value: string): value is IllustrationStyle {
  return value in STYLE_MODIFIERS
}

export async function POST(request: Request) {
  const { user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimit = await enforceGenerationRateLimit(user.id)

  if (!rateLimit.success) {
    return Response.json(
      { error: 'Too many generation requests. Please wait a moment and try again.' },
      { status: 429 }
    )
  }

  const body = await request.json() as GenerateElementsBody
  const prompt = body.prompt?.trim()

  if (!prompt) {
    return Response.json({ error: 'prompt is required' }, { status: 422 })
  }

  if (!body.style || !isIllustrationStyle(body.style)) {
    return Response.json({ error: 'Invalid style' }, { status: 422 })
  }

  const effectiveTier = getEffectiveTier(profile.tier)
  const plan = PLANS[effectiveTier]
  const requestedVariations = typeof body.num_variations === 'number' ? body.num_variations : 1
  const numVariations = Math.max(1, Math.min(8, Math.floor(requestedVariations)))

  if (body.reference_image_r2_key && !plan.reference_image) {
    return Response.json({ error: 'Reference image requires Pro or Business' }, { status: 403 })
  }

  if (body.reference_image_r2_key && !isOwnedR2Key(user.id, body.reference_image_r2_key, ['uploads'])) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (numVariations > plan.max_variations) {
    return Response.json(
      { error: `Your current tier supports up to ${plan.max_variations} variation(s).` },
      { status: 403 }
    )
  }

  if (profile.credits < numVariations) {
    return Response.json({ error: 'Not enough credits. Please top up or subscribe.' }, { status: 403 })
  }

  try {
    // Fetch reference image as base64 if provided (MODE A), otherwise text-only (MODE B)
    let referenceImageBase64: string | undefined
    let referenceImageMimeType: string | undefined

    if (body.reference_image_r2_key) {
      const signedUrl = await getSignedR2Url(body.reference_image_r2_key, 300)
      const imageResponse = await fetch(signedUrl)

      if (!imageResponse.ok) {
        throw new Error('Failed to load reference image for generation.')
      }

      referenceImageBase64 = Buffer.from(await imageResponse.arrayBuffer()).toString('base64')
      referenceImageMimeType = imageResponse.headers.get('content-type') || 'image/png'
    }

    let promptEnhanced: string
    try {
      promptEnhanced = await enhancePrompt(prompt, body.style, referenceImageBase64, referenceImageMimeType)
    } catch (error: any) {
      if (error.message === 'GROQ_RATE_LIMIT') {
        return Response.json(
          { error: 'AI busy. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
      throw error
    }

    console.log('=== GROQ OUTPUT ===')
    console.log('Mode:', referenceImageBase64 ? 'A (with image)' : 'B (text only)')
    console.log('User input:', prompt)
    console.log('Style:', body.style)
    console.log('Enhanced prompt:', promptEnhanced)
    console.log('Word count:', promptEnhanced.split(' ').length)
    console.log('===================')
    const generationStartedAt = Date.now()
    const falResult = await generateElementImages({
      prompt: promptEnhanced,
      numImages: numVariations,
      resolution: plan.resolution,
    })
    const generationId = crypto.randomUUID()

    const uploadedResults = await Promise.all(
      falResult.images.map(async (image, index) => {
        const response = await fetch(image.url)

        if (!response.ok) {
          throw new Error('Failed to download generated image from Fal.ai.')
        }

        const contentType = response.headers.get('content-type') || image.content_type || 'image/jpeg'
        const buffer = Buffer.from(await response.arrayBuffer())
        const r2Key = buildGenerationR2Key(user.id, generationId, index + 1, 'jpg')

        await uploadToR2(r2Key, buffer, contentType)

        return {
          r2_key: r2Key,
          signed_url: await getSignedR2Url(r2Key),
          index,
          format: 'jpg' as const,
        }
      })
    )

    const supabase = createServerClient()
    const generationInsert: Database['public']['Tables']['generations']['Insert'] = {
      profile_id: profile.id,
      clerk_user_id: user.id,
      type: 'element',
      style: body.style,
      prompt_raw: prompt,
      prompt_enhanced: promptEnhanced,
      reference_image_r2_key: body.reference_image_r2_key ?? null,
      invitation_r2_key: null,
      scene_preset: null,
      custom_scene_prompt: null,
      result_r2_keys: uploadedResults.map((result) => result.r2_key),
      result_count: uploadedResults.length,
      model_used: falResult.modelUsed,
      gemini_used: true,
      generation_time_ms: Date.now() - generationStartedAt,
      resolution: plan.resolution,
      is_public: false,
      public_approved: true,
      credits_spent: numVariations,
    }

    const { error: generationError } = await supabase
      .from('generations')
      .insert(generationInsert)

    if (generationError) {
      throw generationError
    }

    const creditsRemaining = profile.credits - numVariations
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ credits: creditsRemaining })
      .eq('clerk_user_id', user.id)

    if (profileError) {
      throw profileError
    }

    return Response.json({
      generation_id: generationId,
      results: uploadedResults,
      credits_remaining: creditsRemaining,
      prompt_enhanced: promptEnhanced,
    })
  } catch (error) {
    console.error('[generate/elements]', error)
    const message = error instanceof Error ? error.message : 'Generation failed. Please try again.'

    return Response.json(
      { error: message || 'Generation failed. Please try again.' },
      { status: 500 }
    )
  }
}
