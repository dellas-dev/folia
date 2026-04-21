import sharp from 'sharp'
import { getCurrentProfile } from '@/lib/clerk/auth'
import { detectPaperCorners } from '@/lib/gemini/detector'
import { getPlanForTier } from '@/lib/plans'
import { compositeOverlay, prepareReference } from '@/lib/perspective/warp'
import { buildGenerationR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'
import { enforceGenerationRateLimit } from '@/lib/upstash/ratelimit'
import type { Database } from '@/types/database.types'

type ExtractBody = {
  reference_r2_key?: string
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

function phaseError(phase: string, error: unknown) {
  return new Error(`${phase}: ${getErrorMessage(error)}`)
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

    // ── Phase 1: Fetch reference from R2 ─────────────────────────────────
    console.log('[extract] Phase 1: fetching reference from R2')
    let refBuffer: Buffer
    let refBase64: string
    let refMimeType: string
    try {
      const signedUrl = await getSignedR2Url(body.reference_r2_key, 300)
      const res = await fetch(signedUrl)
      if (!res.ok) throw new Error(`R2 fetch ${res.status} ${res.statusText}`)
      refBuffer = Buffer.from(await res.arrayBuffer())
      refBase64 = refBuffer.toString('base64')
      refMimeType = res.headers.get('content-type') || 'image/jpeg'
    } catch (error) {
      throw phaseError('Phase 1 failed loading the reference image', error)
    }
    console.log('[extract] Phase 1 OK — size:', refBuffer.length)

    // ── Phase 2: Get original image dimensions ────────────────────────────
    console.log('[extract] Phase 2: reading image dimensions')
    let originalWidth: number
    let originalHeight: number
    try {
      const meta = await sharp(refBuffer).metadata()
      originalWidth  = meta.width!
      originalHeight = meta.height!
    } catch (error) {
      throw phaseError('Phase 2 failed reading image dimensions', error)
    }
    console.log('[extract] Phase 2 OK —', originalWidth, 'x', originalHeight)

    // ── Phase 3: AI corner detection ──────────────────────────────────────
    console.log('[extract] Phase 3: detecting paper corners')
    let corners: Awaited<ReturnType<typeof detectPaperCorners>>
    try {
      corners = await detectPaperCorners(refBase64, refMimeType, originalWidth, originalHeight)
    } catch (error) {
      if (error instanceof Error && error.message === 'CORNER_DETECTION_FAILED') {
        return Response.json(
          {
            error:
              'AI could not detect a paper or card in the reference photo. ' +
              'Make sure the reference shows a clear invitation, sign, or card.',
          },
          { status: 422 }
        )
      }
      throw phaseError('Phase 3 failed detecting paper corners', error)
    }
    console.log('[extract] Phase 3 OK — corners:', corners)

    // ── Phase 4: Prepare reference (resize to bounded space) ──────────────
    console.log('[extract] Phase 4: preparing reference')
    let resizedBuffer: Buffer
    let resW: number
    let resH: number
    try {
      const prepared = await prepareReference(refBuffer)
      resizedBuffer = prepared.resizedBuffer
      resW = prepared.width
      resH = prepared.height
    } catch (error) {
      throw phaseError('Phase 4 failed preparing the reference image', error)
    }
    console.log('[extract] Phase 4 OK — resized:', resW, 'x', resH)

    // ── Phase 5: Scale corners from original → resized space ──────────────
    const scaleX = resW / originalWidth
    const scaleY = resH / originalHeight
    const scaledCorners = {
      topLeft:     { x: Math.round(corners.topLeft.x     * scaleX), y: Math.round(corners.topLeft.y     * scaleY) },
      topRight:    { x: Math.round(corners.topRight.x    * scaleX), y: Math.round(corners.topRight.y    * scaleY) },
      bottomRight: { x: Math.round(corners.bottomRight.x * scaleX), y: Math.round(corners.bottomRight.y * scaleY) },
      bottomLeft:  { x: Math.round(corners.bottomLeft.x  * scaleX), y: Math.round(corners.bottomLeft.y  * scaleY) },
    }
    console.log('[extract] Phase 5 — scaled corners:', scaledCorners)

    // ── Phase 6: Composite white paper over detected area ─────────────────
    console.log('[extract] Phase 6: compositing white paper')
    let composited: Buffer
    try {
      const whiteBuffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } },
      }).png().toBuffer()

      composited = await compositeOverlay(whiteBuffer, resizedBuffer, scaledCorners, resW, resH)
    } catch (error) {
      throw phaseError('Phase 6 failed compositing the white paper', error)
    }
    console.log('[extract] Phase 6 OK — composited size:', composited.length)

    // ── Phase 7: Resize output to 1024×768 max ────────────────────────────
    let finalBuffer: Buffer
    try {
      finalBuffer = await sharp(composited)
        .resize(1024, 768, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer()
    } catch (error) {
      throw phaseError('Phase 7 failed resizing the output', error)
    }

    // ── Phase 8: Upload result to R2 ──────────────────────────────────────
    console.log('[extract] Phase 8: uploading to R2')
    const generationId = crypto.randomUUID()
    const r2Key = buildGenerationR2Key(user.id, generationId, 1, 'png')
    let signedUrl: string
    try {
      await uploadToR2(r2Key, finalBuffer, 'image/png')
      signedUrl = await getSignedR2Url(r2Key)
    } catch (error) {
      throw phaseError('Phase 8 failed saving the extracted template', error)
    }
    console.log('[extract] Phase 8 OK')

    // ── Phase 9: Deduct credit + log ──────────────────────────────────────
    console.log('[extract] Phase 9: Supabase insert + credit deduct')
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
      throw phaseError('Phase 9 failed recording the generation', error)
    }

    return Response.json({
      generation_id: generationId,
      result: { r2_key: r2Key, signed_url: signedUrl },
      credits_remaining: creditsRemaining,
    })

  } catch (error) {
    console.error('[mockup/extract] ERROR:', error)

    if (error instanceof Error && /unsupported image format|input buffer/i.test(error.message)) {
      return Response.json(
        { error: 'The reference image could not be processed. Please try a PNG or JPG file.' },
        { status: 422 }
      )
    }

    const message = error instanceof Error ? error.message : 'Extract Template failed. Please try again.'
    return Response.json({ error: message }, { status: 500 })
  }
}
