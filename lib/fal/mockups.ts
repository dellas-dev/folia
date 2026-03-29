import { FAL_ENDPOINT, FAL_MODELS, getFalHeaders } from '@/lib/fal/client'

type FalMockupImage = {
  url: string
  content_type?: string
}

type GenerateMockupInput = {
  prompt: string
  invitationImageUrl: string
}

export async function generateMockupImage(input: GenerateMockupInput) {
  const response = await fetch(`${FAL_ENDPOINT}/${FAL_MODELS.mockup}`, {
    method: 'POST',
    headers: getFalHeaders(),
    body: JSON.stringify({
      prompt: input.prompt,
      image_url: input.invitationImageUrl,
      output_format: 'png',
      num_images: 1,
      aspect_ratio: '4:3',
      sync_mode: true,
      enhance_prompt: false,
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = await response.json() as { images?: FalMockupImage[] }
  const image = data.images?.[0]

  if (!image?.url) {
    throw new Error('Fal.ai mockup generation did not return an image.')
  }

  return image
}
