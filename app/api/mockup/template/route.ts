import { getCurrentProfile } from '@/lib/clerk/auth'
import { cornersToPixels, getTemplateById } from '@/lib/mockup-templates'
import { compositeOverlay, prepareReference } from '@/lib/perspective/warp'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (profile.tier !== 'pro' && profile.tier !== 'business') {
    return Response.json({ error: 'Mockup Templates require Pro or Business.' }, { status: 403 })
  }

  if (profile.credits < 1) {
    return Response.json({ error: 'Not enough credits. Please top up or subscribe.' }, { status: 403 })
  }

  const body = await request.json() as { design_r2_key?: string; template_id?: string }

  if (!body.design_r2_key || !body.template_id) {
    return Response.json({ error: 'design_r2_key and template_id are required' }, { status: 422 })
  }

  if (!isOwnedR2Key(body.design_r2_key, user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const template = getTemplateById(body.template_id)
  if (!template) {
    return Response.json({ error: 'Template not found.' }, { status: 404 })
  }

  try {
    const startedAt = Date.now()

    // 1. Fetch design from R2 and template image from its hosted URL in parallel
    const designSignedUrl = await getSignedR2Url(body.design_r2_key, 300)

    const [designRes, templateRes] = await Promise.all([
      fetch(designSignedUrl),
      fetch(template.imageUrl),
    ])

    if (!designRes.ok)   throw new Error('Failed to fetch design image.')
    if (!templateRes.ok) throw new Error(`Failed to fetch template image: ${template.id}`)

    const [designBuffer, refBuffer] = await Promise.all([
      designRes.arrayBuffer().then((b) => Buffer.from(b)),
      templateRes.arrayBuffer().then((b) => Buffer.from(b)),
    ])

    // 2. Resize reference to bounded size — corners must match this coordinate space
    const { width: refW, height: refH } = await prepareReference(refBuffer)

    // 3. Convert percentage corners to absolute pixels in the resized reference space
    const corners = cornersToPixels(template.corners, refW, refH)

    console.log(`[mockup/template] Template: ${template.id}, ref: ${refW}×${refH}, corners:`, corners)

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
        reference_image_r2_key: null,
        invitation_r2_key: body.design_r2_key,
        scene_preset: null,
        custom_scene_prompt: `template:${template.id}`,
        result_r2_keys: [r2Key],
        result_count: 1,
        model_used: 'template-warp-v1',
        gemini_used: false,
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
      template_id: template.id,
    })
  } catch (error) {
    console.error('[mockup/template]', error)
    const message = error instanceof Error ? error.message : 'Template mockup failed. Please try again.'
    return Response.json({ error: message }, { status: 500 })
  }
}
