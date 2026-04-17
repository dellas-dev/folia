import { RemoveBgForm } from '@/components/app/remove-bg/remove-bg-form'
import { requireCurrentProfile } from '@/lib/clerk/auth'
import { getSignedR2Url } from '@/lib/r2/client'

type RemoveBgPageProps = {
  searchParams: Promise<{ r2_key?: string }>
}

export default async function RemoveBgPage({ searchParams }: RemoveBgPageProps) {
  const { profile } = await requireCurrentProfile()
  const params = await searchParams

  let initialR2Key: string | undefined
  let initialPreviewUrl: string | undefined

  if (params.r2_key) {
    initialR2Key = params.r2_key
    initialPreviewUrl = await getSignedR2Url(params.r2_key, 300)
  }

  return (
    <RemoveBgForm
      tier={profile.tier}
      startingCredits={profile.credits}
      initialR2Key={initialR2Key}
      initialPreviewUrl={initialPreviewUrl}
    />
  )
}
