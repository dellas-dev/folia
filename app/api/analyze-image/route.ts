import { getCurrentProfile } from '@/lib/clerk/auth'
import { analyzeReferenceImage } from '@/lib/gemini/enhancer'
import { getSignedR2Url, isOwnedR2Key } from '@/lib/r2/client'

export async function POST(request: Request) {
  const { user } = await getCurrentProfile()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { r2_key?: string }

  if (!body.r2_key) {
    return Response.json({ error: 'r2_key is required' }, { status: 422 })
  }

  if (!isOwnedR2Key(body.r2_key, user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const signedUrl = await getSignedR2Url(body.r2_key, 120)
    const imageResponse = await fetch(signedUrl)

    if (!imageResponse.ok) {
      return Response.json({ error: 'Failed to fetch image' }, { status: 500 })
    }

    const imageData = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageData).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/png'

    const suggestedPrompt = await analyzeReferenceImage(base64, mimeType)

    return Response.json({ suggested_prompt: suggestedPrompt })
  } catch (error: any) {
    console.error('[analyze-image] Error:', error?.message || error)
    const message = error?.message || ''

    if (
      message === 'GROQ_RATE_LIMIT' ||
      message.includes('429') ||
      message.includes('rate_limit')
    ) {
      return Response.json({
        suggested_prompt: null,
        error: 'quota_exceeded',
      }, { status: 429 })
    }

    if (
      message === 'GROQ_INVALID_KEY' ||
      message.includes('401') ||
      message.includes('invalid_api_key')
    ) {
      return Response.json({
        suggested_prompt: null,
        error: 'invalid_key',
      }, { status: 500 })
    }

    return Response.json({
      suggested_prompt: null,
      error: 'analysis_failed',
    }, { status: 500 })
  }
}
