import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'

import { createServerClient } from '@/lib/supabase/server'

function getPrimaryEmail(data: {
  email_addresses?: Array<{ id: string; email_address: string }>
  primary_email_address_id?: string | null
}) {
  return data.email_addresses?.find((email) => email.id === data.primary_email_address_id)?.email_address ?? null
}

function getFullName(data: { first_name?: string | null; last_name?: string | null; username?: string | null }) {
  const fullName = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()

  return fullName || data.username || null
}

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request, {
      signingSecret: process.env.CLERK_WEBHOOK_SECRET,
    })

    const supabase = createServerClient()

    if (event.type === 'user.deleted') {
      const clerkUserId = typeof event.data.id === 'string' ? event.data.id : null

      if (clerkUserId) {
        await supabase.from('profiles').delete().eq('clerk_user_id', clerkUserId)
      }

      return Response.json({ ok: true })
    }

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const email = getPrimaryEmail(event.data)

      if (!email) {
        return Response.json({ error: 'User email is missing.' }, { status: 400 })
      }

      const { error } = await supabase.from('profiles').upsert(
        {
          clerk_user_id: event.data.id,
          email,
          full_name: getFullName(event.data),
          avatar_url: event.data.image_url ?? null,
        },
        { onConflict: 'clerk_user_id' }
      )

      if (error) {
        throw error
      }
    }

    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook request.'

    return Response.json({ error: message }, { status: 400 })
  }
}
