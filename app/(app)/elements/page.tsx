import { ElementForm } from '@/components/app/generators/element-form'
import { requireCurrentProfile } from '@/lib/clerk/auth'

export default async function ElementsPage() {
  const { profile } = await requireCurrentProfile()

  return <ElementForm tier={profile.tier} startingCredits={profile.credits} />
}
