export const PLANS = {
  starter: {
    name: 'Starter',
    credits: 8,
    price_idr: 15000,
    price_usd: 1.99,
    max_variations: 1,
    resolution: 1024,
    mockup_access: false,
    reference_image: false,
    mockup_presets: [1, 2, 3],
    custom_scene: false,
    affiliate: false,
    gallery_retention_days: 30,
    is_subscription: false,
    mayar_product_id: process.env.MAYAR_STARTER_PRODUCT_ID,
    polar_product_id: process.env.POLAR_STARTER_PRODUCT_ID,
  },
  pro: {
    name: 'Pro',
    credits: 40,
    price_idr: 89000,
    price_usd: 9.99,
    max_variations: 4,
    resolution: 2048,
    mockup_access: true,
    reference_image: true,
    mockup_presets: [1, 2, 3, 4, 5, 6],
    custom_scene: true,
    affiliate: true,
    gallery_retention_days: 90,
    is_subscription: true,
    mayar_product_id: process.env.MAYAR_PRO_PRODUCT_ID,
    polar_product_id: process.env.POLAR_PRO_PRODUCT_ID,
  },
  business: {
    name: 'Business',
    credits: 80,
    price_idr: 159000,
    price_usd: 19.99,
    max_variations: 4,
    resolution: 2048,
    mockup_access: true,
    reference_image: true,
    mockup_presets: [1, 2, 3, 4, 5, 6],
    custom_scene: true,
    affiliate: true,
    gallery_retention_days: -1,
    is_subscription: true,
    priority_queue: true,
    mayar_product_id: process.env.MAYAR_BUSINESS_PRODUCT_ID,
    polar_product_id: process.env.POLAR_BUSINESS_PRODUCT_ID,
  },
  topup: {
    name: 'Top-up',
    credits: 8,
    price_idr: 20000,
    price_usd: 2.99,
    is_subscription: false,
    mayar_product_id: process.env.MAYAR_TOPUP_PRODUCT_ID,
    polar_product_id: process.env.POLAR_TOPUP_PRODUCT_ID,
  },
} as const

export type PlanKey = keyof typeof PLANS

export function getPlanForTier(tier: 'none' | 'starter' | 'pro' | 'business') {
  if (tier === 'pro' || tier === 'business') {
    return PLANS[tier]
  }

  return PLANS.starter
}
