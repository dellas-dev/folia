import { getCurrentProfile } from '@/lib/clerk/auth'
import { createServerClient } from '@/lib/supabase/server'

type VisibilityBody = {
  generation_id?: string
  is_public?: boolean
}

export async function POST(request: Request) {
  const { user } = await getCurrentProfile()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as VisibilityBody

  if (!body.generation_id || typeof body.is_public !== 'boolean') {
    return Response.json({ error: 'generation_id and is_public are required' }, { status: 422 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('generations')
    .update({ is_public: body.is_public })
    .eq('id', body.generation_id)
    .eq('clerk_user_id', user.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
