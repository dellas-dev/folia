import type { Metadata } from 'next'

import { CommunityPreview } from '@/components/marketing/community-preview'
import { Faq } from '@/components/marketing/faq'
import { GenerationCounter } from '@/components/marketing/generation-counter'
import { Hero } from '@/components/marketing/hero'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { MarketingFooter } from '@/components/marketing/footer'
import { OccasionGallery } from '@/components/marketing/occasion-gallery'
import { PricingCards } from '@/components/marketing/pricing-cards'
import { StyleShowcase } from '@/components/marketing/style-showcase'

export const metadata: Metadata = {
  title: 'Folia | AI Clipart and Mockups for Etsy Sellers',
  description:
    'Generate commercial-ready clipart elements and invitation mockups for Etsy listings, printables, and digital products.',
}

export default function MarketingHomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <Hero />

      <GenerationCounter />

      <HowItWorks />
      <StyleShowcase />
      <OccasionGallery />
      <PricingCards />
      <CommunityPreview />

      <Faq />
      <MarketingFooter />
    </div>
  )
}
