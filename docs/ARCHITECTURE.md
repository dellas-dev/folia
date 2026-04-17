# Technical Architecture — Folia (Final v3)

> Next.js 15 + Clerk + Supabase + Cloudflare R2 + Gemini + Fal.ai + Mayar + Polar

---

## 1. Tech Stack (Final)

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 15** (App Router) + TypeScript | SSR, API routes, server components |
| Styling | **Tailwind CSS 4** + shadcn/ui | Modern, fast, consistent |
| Auth | **Clerk** | Faster setup than Supabase Auth, polished UI, free tier |
| Database | **Supabase** (PostgreSQL) | Reliable, RLS, real-time |
| Storage | **Cloudflare R2** | Zero egress cost — critical for image-heavy app |
| LLM Enhancer | **Google Gemini 2.5 Flash Lite** | Fast, inexpensive, supports vision |
| Image AI (primary) | **Fal.ai Flux Pro** | Best quality for clipart generation |
| Image AI (fallback) | **Fal.ai Flux Dev** | If Flux Pro fails or times out |
| Rate Limiting | **Upstash Redis** | Serverless-compatible rate limiting |
| Payment (Indonesia) | **Mayar** | QRIS, GoPay, OVO, Transfer Bank — no PT required |
| Payment (International) | **Polar** | Auto tax compliance, easy setup for indie makers |
| Email | **Resend** | Transactional emails |
| Deployment | **Vercel** | Seamless Next.js deployment |
| Analytics | **PostHog** | User behavior, funnel tracking |

> **NOT used:** Stripe (replaced by Mayar + Polar), Supabase Auth (replaced by Clerk), Supabase Storage (replaced by Cloudflare R2)

---

## 2. Folder Structure

```
folia/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                  # Landing page
│   │   ├── pricing/page.tsx
│   │   ├── gallery/page.tsx          # Public community gallery
│   │   └── layout.tsx
│   │
│   ├── (app)/                        # Protected — Clerk auth required
│   │   ├── dashboard/page.tsx
│   │   ├── elements/page.tsx         # Element Generator
│   │   ├── mockups/page.tsx          # Mockup Generator
│   │   ├── gallery/page.tsx          # Personal history gallery
│   │   ├── affiliate/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   └── billing/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (auth)/                       # Clerk handles this — minimal custom pages
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   │
│   ├── api/
│   │   ├── generate/
│   │   │   ├── elements/route.ts     # POST — LLM enhance → Fal.ai generate
│   │   │   └── mockup/route.ts       # POST — Fal.ai Kontext
│   │   ├── upload/route.ts           # POST — upload to Cloudflare R2
│   │   ├── webhooks/
│   │   │   ├── mayar/route.ts        # POST — Mayar payment webhook
│   │   │   └── polar/route.ts        # POST — Polar payment webhook
│   │   ├── gallery/
│   │   │   └── public/route.ts       # GET — public community gallery
│   │   └── affiliate/
│   │       ├── create/route.ts
│   │       └── track/route.ts
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                           # shadcn/ui
│   ├── marketing/
│   │   ├── hero.tsx
│   │   ├── style-showcase.tsx        # 5 styles with example outputs
│   │   ├── how-it-works.tsx          # 3-step visual
│   │   ├── occasion-gallery.tsx      # Example outputs grid
│   │   ├── generation-counter.tsx    # Real-time "X elements generated"
│   │   ├── pricing-cards.tsx
│   │   ├── testimonials.tsx
│   │   ├── faq.tsx
│   │   └── footer.tsx
│   │
│   └── app/
│       ├── layout/
│       │   ├── sidebar.tsx
│       │   ├── header.tsx
│       │   └── credits-badge.tsx     # Shows remaining credits
│       ├── generators/
│       │   ├── style-selector.tsx    # 5 style cards
│       │   ├── prompt-input.tsx      # Textarea + rotating examples
│       │   ├── image-uploader.tsx    # Drag-and-drop (R2 upload)
│       │   ├── variation-picker.tsx  # 1–4 selector
│       │   ├── result-grid.tsx       # 1–4 results display
│       │   ├── result-card.tsx       # Single result + download + "make public"
│       │   ├── element-form.tsx
│       │   └── mockup-form.tsx
│       ├── gallery/
│       │   ├── gallery-grid.tsx      # Masonry grid
│       │   ├── gallery-filters.tsx
│       │   └── gallery-item.tsx
│       └── affiliate/
│           ├── referral-link-box.tsx
│           └── affiliate-stats.tsx
│
├── lib/
│   ├── clerk/
│   │   └── auth.ts                   # Clerk helpers
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── r2/
│   │   └── client.ts                 # Cloudflare R2 S3-compatible client
│   ├── gemini/
│   │   └── enhancer.ts               # LLM prompt enhancement logic
│   ├── fal/
│   │   ├── client.ts
│   │   ├── elements.ts               # Element generation + fallback logic
│   │   └── mockups.ts
│   ├── payments/
│   │   ├── mayar.ts                  # Mayar webhook verification + helpers
│   │   └── polar.ts                  # Polar webhook verification + helpers
│   ├── plans.ts                      # Tier definitions + credit limits
│   ├── email/
│   │   └── resend.ts
│   └── utils.ts
│
├── types/
│   ├── database.types.ts
│   └── index.ts
│
├── middleware.ts                      # Clerk auth middleware
├── next.config.ts
└── .env.example
```

---

## 3. Core Flow — Element Generation

```
User selects style + types prompt (or uploads reference image)
    ↓
[Client] If reference image → POST /api/upload → R2 → get URL
    ↓
[Client] POST /api/generate/elements
  { style, prompt, reference_image_url?, num_variations }
    ↓
[Server] Clerk auth check (currentUser())
    ↓
[Server] Load profile from Supabase → check credits
    ↓
[Server] Block if credits = 0
    ↓
[Server] — GEMINI LLM ENHANCER —
  Call Gemini 2.5 Flash Lite:
  • If reference_image_url → vision mode: analyze style from image
  • Enhance user prompt with style modifiers
  • Inject: transparent bg, no text, isolated element, commercial use
  → Returns: optimized_prompt (string)
    ↓
[Server] — FAL.AI IMAGE GENERATION —
  Primary: fal-ai/flux-pro
    { prompt: optimized_prompt, num_images: num_variations }
  Fallback (if error/timeout): fal-ai/flux/dev
    ↓
[Server] For each result image:
  → Download from Fal.ai CDN
  → Upload to Cloudflare R2: generations/{user_id}/{uuid}-{index}.png
  → Generate signed URL (7 days)
    ↓
[Server] Insert into `generations` table (Supabase)
    ↓
[Server] Decrement credits in `profiles` table
    ↓
[Client] Display result grid + download buttons
```

---

## 4. Gemini LLM Enhancer — Detail

```typescript
// lib/gemini/enhancer.ts

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

const SYSTEM_PROMPT = `You are a professional clipart prompt specialist for invitation designers.
Your job is to transform simple user descriptions into highly optimized image generation prompts.

Rules:
- Always produce isolated clipart elements (no scenes, no backgrounds)
- Always end with: transparent background, no text, no letters, isolated element, PNG clipart, professional illustration, commercial use ready
- Preserve the user's requested style modifier
- Output ONLY the enhanced prompt, nothing else`

export async function enhancePrompt(
  userPrompt: string,
  styleModifier: string,
  referenceImageUrl?: string
): Promise<string> {
  const parts: any[] = []

  if (referenceImageUrl) {
    // Vision mode: analyze reference image
    const imageResponse = await fetch(referenceImageUrl)
    const imageData = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageData).toString('base64')
    
    parts.push({
      inlineData: { data: base64, mimeType: 'image/png' }
    })
    parts.push({
      text: `${SYSTEM_PROMPT}\n\nAnalyze the art style, color palette, and technique in this reference image, then generate an optimized prompt for: "${userPrompt}" in ${styleModifier} style.`
    })
  } else {
    parts.push({
      text: `${SYSTEM_PROMPT}\n\nEnhance this prompt: "${userPrompt}" in ${styleModifier} style.`
    })
  }

  const result = await model.generateContent(parts)
  return result.response.text().trim()
}
```

---

## 5. Cloudflare R2 Setup

```typescript
// lib/r2/client.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(key: string, buffer: Buffer, contentType: string) {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.CF_R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
}

export async function getSignedR2Url(key: string, expiresIn = 604800) {
  // 604800 = 7 days
  return getSignedUrl(r2, new GetObjectCommand({
    Bucket: process.env.CF_R2_BUCKET_NAME!,
    Key: key,
  }), { expiresIn })
}
```

---

## 6. Plans Configuration

```typescript
// lib/plans.ts

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
    is_subscription: false,        // one-time purchase
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
    gallery_retention_days: -1,    // unlimited
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
    is_subscription: false,        // one-time purchase
    mayar_product_id: process.env.MAYAR_TOPUP_PRODUCT_ID,
    polar_product_id: process.env.POLAR_TOPUP_PRODUCT_ID,
  },
}
```

---

## 7. Clerk Auth Setup

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/elements(.*)',
  '/mockups(.*)',
  '/gallery(.*)',
  '/affiliate(.*)',
  '/settings(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

```typescript
// Server component usage
import { currentUser } from '@clerk/nextjs/server'

const user = await currentUser()
if (!user) redirect('/sign-in')

// Get profile from Supabase using Clerk user ID
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('clerk_user_id', user.id)
  .single()
```

---

## 8. Payment Flow — Mayar (Indonesia)

```
User clicks "Buy Starter / Subscribe Pro"
    ↓
Server creates Mayar payment link via API
  { amount: 15000, customer_email, metadata: { clerk_user_id, plan } }
    ↓
Redirect to Mayar payment page
    ↓
User pays (QRIS / GoPay / Transfer / etc.)
    ↓
Mayar fires webhook → /api/webhooks/mayar
    ↓
Verify webhook signature
    ↓
payment.success:
  → Add credits to profiles.credits
  → If subscription: update tier + subscription fields
  → Send confirmation email via Resend
```

## 9. Payment Flow — Polar (International)

```
User clicks "Buy / Subscribe" (international)
    ↓
Server creates Polar checkout session
    ↓
Redirect to Polar checkout
    ↓
User pays (Credit Card / PayPal / Apple Pay)
    ↓
Polar fires webhook → /api/webhooks/polar
  (Polar auto-handles VAT/tax for EU/US)
    ↓
order.created / subscription.created:
  → Add credits to profiles.credits
  → If subscription: update tier
  → Send confirmation email via Resend
```

---

## 10. Environment Variables

See `.env.example` for full list.

Key groups:
- `CLERK_*` — Clerk auth keys
- `NEXT_PUBLIC_CLERK_*` — Clerk public keys
- `SUPABASE_*` — Database
- `CF_*` — Cloudflare R2
- `GEMINI_API_KEY` — Google AI
- `FAL_API_KEY` — Fal.ai
- `MAYAR_*` — Indonesia payment
- `POLAR_*` — International payment
- `RESEND_*` — Email
