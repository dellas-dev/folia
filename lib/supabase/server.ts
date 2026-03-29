import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Server-side client using service role key — for server components and API routes
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
