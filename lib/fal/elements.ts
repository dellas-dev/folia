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

async function callFalModel(model: string, input: GenerateElementImagesInput) {
  const response = await fetch(`${FAL_ENDPOINT}/${model}`, {
    method: 'POST',
    headers: getFalHeaders(),
    body: JSON.stringify({
      prompt: input.prompt,
      image_size: {
        width: input.resolution,
        height: input.resolution,
      },
      num_images: input.numImages,
      output_format: 'png',
      sync_mode: true,
      enhance_prompt: false,
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = await response.json() as { images?: FalImage[] }

  if (!Array.isArray(data.images) || data.images.length === 0) {
    throw new Error('Fal.ai did not return any generated images.')
  }

  return data.images
}

export async function generateElementImages(input: GenerateElementImagesInput): Promise<FalGenerationResponse> {
  try {
    const images = await callFalModel(FAL_MODELS.elementsPrimary, input)

    return {
      images,
      modelUsed: FAL_MODELS.elementsPrimary,
    }
  } catch {
    const images = await callFalModel(FAL_MODELS.elementsFallback, input)

    return {
      images,
      modelUsed: FAL_MODELS.elementsFallback,
    }
  }
}
