import { getCurrentProfile } from '@/lib/clerk/auth'
import { detectMockupCorners } from '@/lib/gemini/enhancer'
import { compositeOverlay, prepareReference } from '@/lib/perspective/warp'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (profile.tier !== 'pro' && profile.tier !== 'business') {
    return Response.json({ error: 'Mockup Overlay requires Pro or Business.' }, { status: 403 })
  }

  if (profile.credits < 1) {
    return Response.json({ error: 'Not enough credits. Please top up or subscribe.' }, { status: 403 })
  }

  const body = await request.json() as { design_r2_key?: string; reference_r2_key?: string }

  if (!body.design_r2_key || !body.reference_r2_key) {
    return Response.json({ error: 'design_r2_key and reference_r2_key are required' }, { status: 422 })
  }

  if (!isOwnedR2Key(body.design_r2_key, user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isOwnedR2Key(body.reference_r2_key, user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const startedAt = Date.now()

    // 1. Fetch both images from R2
    const [designSignedUrl, refSignedUrl] = await Promise.all([
      getSignedR2Url(body.design_r2_key, 300),
      getSignedR2Url(body.reference_r2_key, 300),
    ])

    const [designRes, refRes] = await Promise.all([
      fetch(designSignedUrl),
      fetch(refSignedUrl),
    ])

    if (!designRes.ok) throw new Error('Failed to fetch design image.')
    if (!refRes.ok) throw new Error('Failed to fetch reference image.')

    const [designBuffer, refBuffer] = await Promise.all([
      designRes.arrayBuffer().then((b) => Buffer.from(b)),
      refRes.arrayBuffer().then((b) => Buffer.from(b)),
    ])

    // 2. Resize reference to bounded size — corners will be in this coordinate space
    const { resizedBuffer: refResized, width: refW, height: refH } = await prepareReference(refBuffer)

    // 3. Detect the 4 corners of the design surface using Groq Vision
    const refBase64 = refResized.toString('base64')
    const corners = await detectMockupCorners(refBase64, 'image/jpeg', refW, refH)

    console.log('[mockup/overlay] Detected corners:', corners)

    // 4. Perspective warp + multiply composite
    const composited = await compositeOverlay(designBuffer, refBuffer, corners, refW, refH)

    // 5. Upload result to R2
    const generationId = crypto.randomUUID()
    const r2Key = buildGenerationR2Key(user.id, generationId, 1, 'png')
    await uploadToR2(r2Key, composited, 'image/png')
    const signedUrl = await getSignedR2Url(r2Key)

    // 6. Deduct credit + log generation
    const supabase = createServerClient()
    const creditsRemaining = profile.credits - 1

    const [creditsResult, generationResult] = await Promise.all([
      supabase
        .from('profiles')
        .update({ credits: creditsRemaining })
        .eq('clerk_user_id', user.id),
      supabase.from('generations').insert({
        profile_id: profile.id,
        clerk_user_id: user.id,
        type: 'mockup' as const,
        style: null,
        prompt_raw: null,
        prompt_enhanced: null,
        reference_image_r2_key: body.reference_r2_key,
        invitation_r2_key: body.design_r2_key,
        scene_preset: null,
        custom_scene_prompt: 'perspective-overlay',
        result_r2_keys: [r2Key],
        result_count: 1,
        model_used: 'perspective-warp-v1',
        gemini_used: true,
        generation_time_ms: Date.now() - startedAt,
        resolution: 1500,
        is_public: false,
        public_approved: true,
        credits_spent: 1,
      }),
    ])

    if (creditsResult.error) throw creditsResult.error
    if (generationResult.error) throw generationResult.error

    return Response.json({
      r2_key: r2Key,
      signed_url: signedUrl,
      credits_remaining: creditsRemaining,
      corners,
    })
  } catch (error) {
    console.error('[mockup/overlay]', error)

    if (error instanceof Error && error.message === 'GROQ_RATE_LIMIT') {
      return Response.json(
        { error: 'Vision analysis is temporarily rate-limited. Please try again in a moment.' },
        { status: 429 }
      )
    }

    if (error instanceof Error && error.message === 'CORNER_DETECTION_FAILED') {
      return Response.json(
        { error: 'Could not detect the design surface in the reference photo. Try a clearer photo where the board or easel is visible.' },
        { status: 422 }
      )
    }

    const message = error instanceof Error ? error.message : 'Overlay failed. Please try again.'
    return Response.json({ error: message }, { status: 500 })
  }
}
