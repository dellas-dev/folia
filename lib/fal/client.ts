// Fal.ai REST client — server-side only
export const FAL_ENDPOINT = 'https://fal.run'

export const FAL_MODELS = {
  elementsPrimary: 'fal-ai/flux-pro',
  elementsFallback: 'fal-ai/flux/dev',
  bgRemoval: 'fal-ai/bria/background-removal',
  mockup: 'fal-ai/flux-pro/kontext',
} as const

export function getFalHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Key ${process.env.FAL_API_KEY}`,
  }
}
