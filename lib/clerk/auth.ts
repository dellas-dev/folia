import type { User } from '@clerk/nextjs/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export { auth, currentUser }

export type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Minimal user shape returned by getCurrentProfile / requireCurrentProfile.
 * Populated from the JWT (auth()) + Supabase profile — no Clerk API call needed
 * for returning users, so connectivity issues with Clerk's backend won't break
 * every page load.
 */
export type AppUser = {
  id: string
  firstName: string | null
  fullName: string | null
}

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

/**
 * Uses auth() (JWT-only, no network) as the primary auth check.
 * currentUser() (Clerk API call) is only used for first-time profile creation.
 */
export async function getCurrentProfile(): Promise<{
  user: AppUser | null
  profile: Profile | null
}> {
  const { userId } = await auth()

  if (!userId) {
    return { user: null, profile: null }
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    // Profile exists — build AppUser from JWT + Supabase data, no Clerk API call
    const fullName = data.full_name ?? null
    const firstName = fullName?.split(' ')[0] ?? null
    return {
      user: { id: userId, firstName, fullName },
      profile: data,
    }
  }

  // First-time user: profile doesn't exist yet — must call Clerk API to sync
  const clerkUser = await currentUser()
  if (!clerkUser) {
    return { user: null, profile: null }
  }

  const profile = await syncProfileFromClerkUser(clerkUser)
  const fullName = getFullName(clerkUser)
  return {
    user: {
      id: clerkUser.id,
      firstName: clerkUser.firstName ?? fullName?.split(' ')[0] ?? null,
      fullName,
    },
    profile,
  }
}

export async function requireCurrentProfile() {
  const { user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/sign-in')
  }

  return { user, profile }
}
