import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

function isNetworkError(error: unknown) {
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

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit) {
  let attempt = 0
  const maxRetries = 2

  while (true) {
    try {
      return await fetch(input, init)
    } catch (error) {
      if (!isNetworkError(error) || attempt >= maxRetries) {
        throw error
      }

      attempt += 1
      await sleep(800 * attempt)
    }
  }
}

// Server-side client using service role key — for server components and API routes
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: fetchWithRetry,
      },
    }
  )
}
