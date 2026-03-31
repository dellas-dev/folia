import { FAL_ENDPOINT, FAL_MODELS, getFalHeaders } from '@/lib/fal/client'

type FalImage = {
  url: string
  content_type?: string
}

type FalGenerationResponse = {
  images: FalImage[]
  modelUsed: string
}

type GenerateElementImagesInput = {
  prompt: string
  numImages: number
  resolution: number
}

async function generateSingleImage(model: string, prompt: string, resolution: number): Promise<FalImage> {
  const response = await fetch(`${FAL_ENDPOINT}/${model}`, {
    method: 'POST',
    headers: getFalHeaders(),
    body: JSON.stringify({
      prompt,
      image_size: {
        width: resolution,
        height: resolution,
      },
      num_images: 1,
      output_format: 'jpeg',
      sync_mode: true,
      enhance_prompt: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Fal.ai generation failed: ${await response.text()}`)
  }

  const data = await response.json() as { images?: FalImage[] }

  if (!Array.isArray(data.images) || data.images.length === 0) {
    throw new Error('Fal.ai did not return any generated images.')
  }

  return data.images[0]
}

export async function generateElementImages(input: GenerateElementImagesInput): Promise<FalGenerationResponse> {
  let modelUsed: string = FAL_MODELS.elementsPrimary

  const generateWithFallback = async (): Promise<FalImage[]> => {
    try {
      return await Promise.all(
        Array.from({ length: input.numImages }, () =>
          generateSingleImage(FAL_MODELS.elementsPrimary, input.prompt, input.resolution)
        )
      )
    } catch {
      modelUsed = FAL_MODELS.elementsFallback
      return await Promise.all(
        Array.from({ length: input.numImages }, () =>
          generateSingleImage(FAL_MODELS.elementsFallback, input.prompt, input.resolution)
        )
      )
    }
  }

  const images = await generateWithFallback()

  return { images, modelUsed }
}
