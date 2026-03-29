import type { User } from '@clerk/nextjs/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export { auth, currentUser }

export type Profile = Database['public']['Tables']['profiles']['Row']

function getPrimaryEmail(user: User) {
  return user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress
    ?? user.primaryEmailAddress?.emailAddress
    ?? null
}

function getFullName(user: User) {
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  return fullName || user.username || null
}

export async function syncProfileFromClerkUser(user: User) {
  const email = getPrimaryEmail(user)

  if (!email) {
    throw new Error('Clerk user is missing a primary email address.')
  }

  const cookieStore = await cookies()
  const referredByCode = cookieStore.get('ref')?.value ?? null
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        clerk_user_id: user.id,
        email,
        full_name: getFullName(user),
        avatar_url: user.imageUrl,
        referred_by_code: referredByCode,
      },
      { onConflict: 'clerk_user_id' }
    )
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getCurrentProfile() {
  const user = await currentUser()

  if (!user) {
    return { user: null, profile: null }
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return {
    user,
    profile: data ?? (await syncProfileFromClerkUser(user)),
  }
}

export async function requireCurrentProfile() {
  const { user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/sign-in')
  }

  return { user, profile }
}
