import { getCurrentProfile } from '@/lib/clerk/auth'
import { FAL_ENDPOINT, FAL_MODELS, fetchFal, getFalHeaders, getFalMissingEnv, isFalNetworkError } from '@/lib/fal/client'
import { buildRemoveBgR2Key, getSignedR2Url, isOwnedR2Key, uploadToR2 } from '@/lib/r2/client'
import { createServerClient } from '@/lib/supabase/server'

const REQUIRED_REMOVE_BG_ENV = [
  'CF_ACCOUNT_ID',
  'CF_R2_ACCESS_KEY_ID',
  'CF_R2_SECRET_ACCESS_KEY',
  'CF_R2_BUCKET_NAME',
] as const

export async function POST(request: Request) {
  const { user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (profile.credits < 1) {
    return Response.json({ error: 'Not enough credits. Please top up or subscribe.' }, { status: 403 })
  }

  const body = await request.json() as { r2_key?: string }

  if (!body.r2_key) {
    return Response.json({ error: 'r2_key is required' }, { status: 422 })
  }

  if (!isOwnedR2Key(body.r2_key, user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const missingEnv = [...getFalMissingEnv(), ...REQUIRED_REMOVE_BG_ENV.filter((name) => !process.env[name])]

  if (missingEnv.length > 0) {
    return Response.json(
      { error: `Remove BG is not configured. Missing env: ${missingEnv.join(', ')}` },
      { status: 500 }
    )
  }

  try {
    const inputUrl = await getSignedR2Url(body.r2_key, 300)

    const falResponse = await fetchFal(`${FAL_ENDPOINT}/${FAL_MODELS.bgRemoval}`, {
      method: 'POST',
      headers: getFalHeaders(),
      body: JSON.stringify({ image_url: inputUrl, sync_mode: true }),
    })

    if (!falResponse.ok) {
      throw new Error(`Background removal failed: ${await falResponse.text()}`)
    }

    const falData = await falResponse.json() as { image?: { url: string } }

    if (!falData.image?.url) {
      throw new Error('Background removal returned no image.')
    }

    const resultResponse = await fetch(falData.image.url)

    if (!resultResponse.ok) {
      throw new Error('Failed to download processed image.')
    }

    const buffer = Buffer.from(await resultResponse.arrayBuffer())
    const r2Key = buildRemoveBgR2Key(user.id)

    await uploadToR2(r2Key, buffer, 'image/png')

    const signedUrl = await getSignedR2Url(r2Key)

    const supabase = createServerClient()
    const { error } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('clerk_user_id', user.id)

    if (error) throw error

    return Response.json({
      signed_url: signedUrl,
      credits_remaining: profile.credits - 1,
    })
  } catch (error) {
    console.error('[remove-bg]', error)

    if (isFalNetworkError(error)) {
      return Response.json(
        { error: 'Background removal service is temporarily unreachable. Please try again in a moment.' },
        { status: 503 }
      )
    }

    const message = error instanceof Error ? error.message : 'Background removal failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
