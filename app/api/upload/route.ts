import { currentUser } from '@clerk/nextjs/server'

import { buildUploadR2Key, uploadToR2 } from '@/lib/r2/client'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ALLOWED_PURPOSES = new Set(['reference', 'invitation'])
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  const user = await currentUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const purpose = formData.get('purpose')

  if (!(file instanceof File)) {
    return Response.json({ error: 'file is required' }, { status: 422 })
  }

  if (typeof purpose !== 'string' || !ALLOWED_PURPOSES.has(purpose)) {
    return Response.json({ error: 'Invalid upload purpose' }, { status: 422 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: 'Only PNG, JPEG, and WEBP files are allowed.' }, { status: 422 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File size must be 10 MB or smaller.' }, { status: 422 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const r2Key = buildUploadR2Key(user.id, file.name)

  await uploadToR2(r2Key, buffer, file.type)

  return Response.json({
    r2_key: r2Key,
    size: file.size,
  })
}
