import { FAL_ENDPOINT, FAL_MODELS, fetchFal, getFalHeaders } from '@/lib/fal/client'

type FalImage = {
  url: string
  content_type?: string
}

export async function generateSceneBackground(prompt: string): Promise<{ buffer: Buffer; content_type: string }> {
  const response = await fetchFal(`${FAL_ENDPOINT}/${FAL_MODELS.schnell}`, {
    method: 'POST',
    headers: getFalHeaders(),
    body: JSON.stringify({
      prompt,
      image_size: { width: 1024, height: 768 },
      num_inference_steps: 4,
      num_images: 1,
      sync_mode: true,
      enable_safety_checker: false,
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = await response.json() as { images?: FalImage[] }
  const image = data.images?.[0]

  if (!image?.url) {
    throw new Error('Fal.ai background generation did not return an image.')
  }

  const content_type = image.content_type ?? 'image/jpeg'

  // Fal sync_mode returns data URIs for small/fast requests — decode directly
  if (image.url.startsWith('data:')) {
    const base64 = image.url.split(',')[1]
    if (!base64) throw new Error('Fal.ai returned a malformed data URI.')
    return { buffer: Buffer.from(base64, 'base64'), content_type }
  }

  // HTTP URL — fetch normally
  const res = await fetch(image.url)
  if (!res.ok) throw new Error(`Failed to download Fal background: ${res.status}`)
  return { buffer: Buffer.from(await res.arrayBuffer()), content_type }
}
