import type { Metadata } from 'next'

import { Faq } from '@/components/marketing/faq'
import { Hero } from '@/components/marketing/hero'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { MarketingFooter } from '@/components/marketing/footer'
import { OccasionGallery } from '@/components/marketing/occasion-gallery'
import { PricingCards } from '@/components/marketing/pricing-cards'
import { StyleShowcase } from '@/components/marketing/style-showcase'
import { getMarketingLocale } from '@/lib/marketing/locale'

export const metadata: Metadata = {
  title: 'Folia | AI Clipart and Mockups for Etsy Sellers',
  description:
    'Generate commercial-ready clipart elements and invitation mockups for Etsy listings, printables, and digital products.',
}

export default function MarketingHomePage() {
  const localePromise = getMarketingLocale()

  return <MarketingHomePageInner localePromise={localePromise} />
}

async function MarketingHomePageInner({ localePromise }: { localePromise: ReturnType<typeof getMarketingLocale> }) {
  const locale = await localePromise
  const marqueeItems = locale === 'id'
    ? [
        '"Folia bikin storefront saya terlihat jauh lebih rapi."',
        '"Style watercolor-nya cocok buat printable wedding."',
        '"Akhirnya ada workflow mockup yang tidak ribet."',
        '"Lebih cepat publish bundle baru tiap minggu."',
      ]
    : [
        '"Folia made my storefront look dramatically cleaner."',
        '"The watercolor output works perfectly for wedding printables."',
        '"Finally, a mockup workflow that does not feel clunky."',
        '"It is much faster to publish new bundles every week."',
      ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:gap-12 lg:py-14">
      <Hero locale={locale} />

      <section className="overflow-hidden rounded-[1.75rem] bg-[#37656b] py-4">
        <div className="flex min-w-max animate-[marquee_24s_linear_infinite] gap-10 px-6 text-sm font-bold text-white">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span key={`${item}-${index}`} className="whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </section>

      <HowItWorks locale={locale} />
      <StyleShowcase locale={locale} />
      <OccasionGallery locale={locale} />
      <PricingCards locale={locale} />
      <Faq locale={locale} />
      <MarketingFooter locale={locale} />
    </div>
  )
}
