import { FAL_ENDPOINT, FAL_MODELS, fetchFal, getFalHeaders } from '@/lib/fal/client'

type FalImage = {
  url: string
  content_type?: string
}

export async function generateSceneBackground(prompt: string): Promise<{ url: string; content_type: string }> {
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

  return { url: image.url, content_type: image.content_type ?? 'image/jpeg' }
}
