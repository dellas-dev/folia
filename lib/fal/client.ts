// Fal.ai REST client — server-side only
export const FAL_ENDPOINT = 'https://fal.run'

const REQUIRED_FAL_ENV = ['FAL_API_KEY'] as const

export const FAL_MODELS = {
  elementsPrimary: 'fal-ai/flux-pro',
  elementsFallback: 'fal-ai/flux/dev',
  bgRemoval: 'fal-ai/bria/background/remove',
  mockup: 'fal-ai/flux-pro/kontext',
  schnell: 'fal-ai/flux/schnell',
} as const

export function getFalHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Key ${process.env.FAL_API_KEY}`,
  }
}

export function getFalMissingEnv() {
  return REQUIRED_FAL_ENV.filter((name) => !process.env[name])
}

export function isFalNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false

  const details = [
    error.message,
    error.stack ?? '',
    error.cause ? String(error.cause) : '',
  ]
    .join(' ')
    .toLowerCase()

  return [
    'fetch failed',
    'connect timeout',
    'und_err_connect_timeout',
    'econnreset',
    'etimedout',
    'enotfound',
    'eai_again',
    'socket hang up',
  ].some((needle) => details.includes(needle))
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type FalFetchOptions = RequestInit & {
  retries?: number
  retryDelayMs?: number
}

export async function fetchFal(url: string, options: FalFetchOptions = {}) {
  const {
    retries = 1,
    retryDelayMs = 1200,
    ...requestInit
  } = options

  let attempt = 0
  let lastError: unknown

  while (attempt <= retries) {
    try {
      return await fetch(url, requestInit)
    } catch (error) {
      lastError = error

      if (!isFalNetworkError(error) || attempt === retries) {
        throw error
      }

      await sleep(retryDelayMs * (attempt + 1))
      attempt += 1
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Fal request failed.')
}
