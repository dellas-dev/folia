import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'folia:element-generate',
    })
  : null

export async function enforceGenerationRateLimit(identifier: string) {
  if (!ratelimit) {
    return { success: true, reset: undefined as number | undefined }
  }

  const result = await ratelimit.limit(identifier)

  return {
    success: result.success,
    reset: result.reset,
  }
}
