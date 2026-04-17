import { getCurrentProfile } from '@/lib/clerk/auth'
import { getSignedR2Url, isOwnedR2Key } from '@/lib/r2/client'

export async function GET(request: Request) {
  const { user } = await getCurrentProfile()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const r2Key = searchParams.get('key')

  if (!r2Key) {
    return new Response('Missing key', { status: 400 })
  }

  if (!isOwnedR2Key(r2Key, user.id)) {
    return new Response('Forbidden', { status: 403 })
  }

  const signedUrl = await getSignedR2Url(r2Key, 60)
  const response = await fetch(signedUrl)

  if (!response.ok) {
    return new Response('Failed to fetch file', { status: 502 })
  }

  const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
  const filename = r2Key.split('/').pop() ?? 'download'

  return new Response(response.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=60',
    },
  })
}
