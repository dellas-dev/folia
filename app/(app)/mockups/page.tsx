import { MockupForm } from '@/components/app/generators/mockup-form'
import { requireCurrentProfile } from '@/lib/clerk/auth'

export default async function MockupsPage() {
  const { profile } = await requireCurrentProfile()

  return <MockupForm tier={profile.tier} startingCredits={profile.credits} />
}
