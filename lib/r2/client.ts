import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

export async function uploadToR2(key: string, buffer: Buffer, contentType: string) {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.CF_R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
}

export async function getSignedR2Url(key: string, expiresIn = 604800): Promise<string> {
  return getSignedUrl(r2, new GetObjectCommand({
    Bucket: process.env.CF_R2_BUCKET_NAME!,
    Key: key,
  }), { expiresIn })
}

export function isOwnedR2Key(key: string, clerkUserId: string) {
  return (
    key.startsWith(`uploads/${clerkUserId}/`) ||
    key.startsWith(`generations/${clerkUserId}/`) ||
    key.startsWith(`removebg/${clerkUserId}/`) ||
    key.startsWith(`extracted/${clerkUserId}/`)
  )
}

export function buildUploadR2Key(clerkUserId: string, originalFilename: string) {
  const sanitized = originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `uploads/${clerkUserId}/${Date.now()}-${sanitized || 'file'}`
}

export function buildGenerationR2Key(clerkUserId: string, generationId: string, index: number, ext = 'png') {
  return `generations/${clerkUserId}/${generationId}-${index}.${ext}`
}

export function buildExtractedR2Key(clerkUserId: string, generationId: string, ext = 'png') {
  return `extracted/${clerkUserId}/${generationId}.${ext}`
}

export function buildRemoveBgR2Key(clerkUserId: string) {
  return `removebg/${clerkUserId}/${Date.now()}.png`
}
