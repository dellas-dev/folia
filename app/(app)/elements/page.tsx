import { ElementForm } from '@/components/app/generators/element-form'
import { requireCurrentProfile } from '@/lib/clerk/auth'
import type { IllustrationStyle } from '@/types'

type ElementsPageProps = {
  searchParams: Promise<{
    prompt?: string
    style?: string
  }>
}

function isIllustrationStyle(value: string): value is IllustrationStyle {
  return ['watercolor', 'line_art', 'cartoon', 'boho', 'minimalist'].includes(value)
}

export default async function ElementsPage({ searchParams }: ElementsPageProps) {
  const { profile } = await requireCurrentProfile()
  const params = await searchParams
  const initialPrompt = params.prompt?.trim() ?? ''
  const initialStyle = params.style && isIllustrationStyle(params.style) ? params.style : undefined

  return <ElementForm tier={profile.tier} startingCredits={profile.credits} initialPrompt={initialPrompt} initialStyle={initialStyle} />
}
