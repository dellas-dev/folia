import { MockupForm } from '@/components/app/generators/mockup-form'
import { requireCurrentProfile } from '@/lib/clerk/auth'
import { getSignedR2Url } from '@/lib/r2/client'

type MockupsPageProps = {
  searchParams: Promise<{ r2_key?: string }>
}

export default async function MockupsPage({ searchParams }: MockupsPageProps) {
  const { profile } = await requireCurrentProfile()
  const params = await searchParams

  let initialInvitationKey: string | undefined
  let initialPreviewUrl: string | undefined

  if (params.r2_key) {
    initialInvitationKey = params.r2_key
    initialPreviewUrl = await getSignedR2Url(params.r2_key, 300)
  }

  return (
    <MockupForm
      tier={profile.tier}
      startingCredits={profile.credits}
      initialInvitationKey={initialInvitationKey}
      initialPreviewUrl={initialPreviewUrl}
    />
  )
}
