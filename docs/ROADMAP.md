# Development Roadmap — Folia (Final v3)

---

## Recommended Build Order

```
Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
```

> Build generators BEFORE payment — test manually with direct DB credit insert.
> Build payment BEFORE affiliate — affiliate depends on purchase webhooks.

---

## Phase 0 — Setup & Infrastructure
*Estimated: 1–2 days*

- [ ] Create Next.js 15 project
  ```bash
  npx create-next-app@latest folia --typescript --tailwind --app
  ```
- [ ] Install shadcn/ui
  ```bash
  npx shadcn@latest init
  ```
- [ ] Install dependencies
  ```bash
  npm install @clerk/nextjs @supabase/supabase-js @google/generative-ai
  npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
  npm install @upstash/ratelimit @upstash/redis resend
  ```
- [ ] Set up Clerk
  - Create app at clerk.com
  - Configure Google OAuth
  - Set up Supabase JWT template in Clerk dashboard
  - Add `CLERK_*` keys to `.env.local`
- [ ] Set up Supabase
  - Create project at supabase.com
  - Run all SQL from `DATABASE_SCHEMA.md`
  - Configure JWT secret from Clerk
- [ ] Set up Cloudflare R2
  - Create R2 bucket: `folia-storage`
  - Create API token with R2 read/write permissions
  - Add `CF_*` keys to `.env.local`
- [ ] Set up Fal.ai — get API key at fal.ai
- [ ] Set up Google AI Studio — get Gemini API key
- [ ] Set up Resend — get API key at resend.com
- [ ] Set up Upstash Redis — create database at upstash.com
- [ ] Configure `.env.local` with all keys
- [ ] Deploy blank app to Vercel + add all env vars
- [ ] Set up GitHub repository

**Deliverable:** All services connected, blank Next.js app deployed.

---

## Phase 1 — Auth + App Shell
*Estimated: 2 days*

- [ ] Install and configure Clerk middleware (`middleware.ts`)
- [ ] Build sign-in page (`/sign-in`) — Clerk component
- [ ] Build sign-up page (`/sign-up`) — Clerk component + capture `ref` cookie
- [ ] Build Clerk webhook to auto-create profile in Supabase on signup
  ```typescript
  // /api/webhooks/clerk/route.ts
  // event: user.created → insert into profiles table
  ```
- [ ] Build app layout (`(app)/layout.tsx`)
  - Sidebar: Dashboard / Elements / Mockups / Gallery / Affiliate / Settings
  - Header: user avatar (Clerk) + credits badge
- [ ] Build `CreditsBadge` component — shows remaining credits, red when < 3
- [ ] Build Dashboard page (`/dashboard`)
  - Credits card with progress bar
  - Quick action buttons
  - "Buy credits" CTA if credits = 0

**Deliverable:** Auth flow works. Users can sign up, log in, see dashboard.

---

## Phase 2 — Element Generator (Core)
*Estimated: 3–4 days*

- [ ] Build `lib/r2/client.ts` — R2 upload + signed URL functions
- [ ] Build `lib/ai/enhancer.ts` — LLM prompt enhancement
  - Text mode: enhance prompt with style modifiers
  - Vision mode: analyze reference image → generate matching prompt
- [ ] Build `lib/fal/elements.ts` — generation with fallback logic
  ```typescript
  try { flux-pro } catch { flux-dev }
  ```
- [ ] Build `POST /api/upload` route
- [ ] Build `POST /api/generate/elements` route
  - Full pipeline: auth → credits check → Gemini enhance → Fal.ai generate → R2 store
  - Rate limiting via Upstash Redis
- [ ] Build Element Generator page components:
  - `StyleSelector` — 5 cards with icon + name + example output thumbnail
  - `PromptInput` — textarea with rotating placeholder examples:
    ```
    "Cute panda holding colorful balloons"
    "Eucalyptus branch with small white roses"
    "Jack-o-lantern with spider web and bats"
    "Watercolor Christmas tree with ornaments"
    "Pink peony with soft green leaves"
    "Baby dinosaur wearing a party hat"
    "Snowflake with holly berries"
    "Hot air balloon floating in clouds"
    "Cute bunny with Easter eggs"
    "Golden wedding rings with flowers"
    ```
  - `ImageUploader` — drag-and-drop, locked for Starter with upgrade tooltip
  - `VariationPicker` — 1/2/3/4 toggle, Starter locked to 1
  - `ResultGrid` — 1–4 result cards
  - `ResultCard` — image + Download button + "Make Public" toggle
- [ ] Build Element Generator page (`/elements`)

**Deliverable:** Users can generate clipart elements and download PNG.

---

## Phase 3 — Mockup Generator
*Estimated: 2 days*

- [ ] Build `lib/fal/mockups.ts` — scene prompt map + Kontext call
- [ ] Build `POST /api/generate/mockup` route
  - Pro/Business gate
  - Scene resolution + Fal.ai Kontext Pro call
- [ ] Build Mockup Generator page components:
  - `ScenePresetGrid` — 6 scene cards with preview photo
    - Starter sees 3 locked scenes with upgrade overlay
  - `CustomSceneInput` — gated for Starter
- [ ] Build Mockup Generator page (`/mockups`)
  - Full upgrade wall for users with 0 credits or Starter tier

**Deliverable:** Pro/Business users can generate mockup listing photos.

---

## Phase 4 — Gallery (Personal + Public)
*Estimated: 2 days*

- [ ] Build `GET /api/gallery/public` route — public community gallery
- [ ] Build Personal Gallery page (`/gallery`)
  - Masonry grid
  - Filter: All / Elements / Mockups + Style chips
  - Re-download with fresh signed URL
  - Retention enforcement (30 days Starter, 90 days Pro, unlimited Business)
  - Toggle "Make Public" on any generation
- [ ] Build Public Community Gallery (`/gallery` on marketing site)
  - Accessible without login
  - Filter by style
  - Real-time counter: "X elements generated"
  - CTA: "Create your own → Sign up"
- [ ] Build `GenerationCounter` component for landing page + dashboard

**Deliverable:** Personal gallery + public showcase gallery live.

---

## Phase 5 — Payments
*Estimated: 3 days*

- [ ] Build `lib/payments/mayar.ts` — Mayar API + webhook verification
- [ ] Build `lib/payments/polar.ts` — Polar API + webhook verification
- [ ] Build `POST /api/webhooks/mayar` — handle all Mayar events
- [ ] Build `POST /api/webhooks/polar` — handle all Polar events
- [ ] Build `POST /api/webhooks/clerk` — create Supabase profile on signup
- [ ] Set up Mayar products:
  - Starter (one-time Rp 15.000)
  - Pro (subscription Rp 89.000/month)
  - Business (subscription Rp 159.000/month)
  - Top-up (one-time Rp 20.000)
- [ ] Set up Polar products (same 4 products in USD):
  - Starter $1.99 / Pro $9.99/mo / Business $19.99/mo / Top-up $2.99
- [ ] Build Pricing page (`/pricing`)
  - Currency toggle: IDR 🇮🇩 / USD 🌍
  - 4 tier cards: Starter / Pro / Business / Top-up
  - Feature comparison table
- [ ] Build Billing settings page (`/settings/billing`)
  - Current credits + tier display
  - Buy more / Upgrade buttons
  - Subscription management link
- [ ] Set up Resend email templates:
  - Purchase confirmation
  - Subscription renewal
  - Cancellation confirmation
  - Low credits warning (< 3 credits)

**Deliverable:** Full payment flow working for both Indonesia and international.

---

## Phase 6 — Affiliate Program
*Estimated: 1–2 days*

- [ ] Build `POST /api/affiliate/create` route
- [ ] Build `GET /api/affiliate/track` route (click tracking + cookie)
- [ ] Pass `ref` cookie in purchase metadata (Mayar + Polar)
- [ ] Award credits to affiliate in payment webhooks
- [ ] Build Affiliate page (`/affiliate`)
  - Locked for Starter with upgrade prompt
  - Referral link + copy button
  - Stats: Clicks / Conversions / Credits Earned
  - How it works explanation

**Deliverable:** Pro/Business users can share referral links and earn credits.

---

## Phase 7 — Landing Page
*Estimated: 2–3 days*

- [ ] Build Landing page sections:
  - **Hero** — headline + rotating example outputs + CTA "Start for Rp 15.000"
  - **Generation Counter** — live "X elements generated" number
  - **How It Works** — 3 steps: Pick style → Write/upload → Download PNG
  - **Style Showcase** — tab through 5 styles with example outputs
  - **Occasions Grid** — example outputs: wedding, birthday, Christmas, Halloween, baby shower
  - **Mockup Feature** — before/after: design → styled photo
  - **Pricing** — IDR/USD toggle + 4 tier cards
  - **Community Gallery** — preview of public user-generated elements
  - **FAQ** — 8 questions
  - **Footer**
- [ ] SEO setup:
  - `metadata` on all pages
  - Open Graph images
  - `/sitemap.xml`
  - `/robots.txt`

**Deliverable:** Public landing page ready for traffic.

---

## Phase 8 — Polish & Launch
*Estimated: 2 days*

- [ ] Toast notifications (success / error / low credits warning)
- [ ] Loading skeletons on gallery and generation waiting state
- [ ] Empty states (first time user, no generations yet)
- [ ] Mobile responsiveness audit
- [ ] Rate limiting audit (Upstash Redis on all generation routes)
- [ ] Set up PostHog:
  - Track: `generation_created`, `purchase_completed`, `upgrade_clicked`, `referral_shared`
- [ ] End-to-end test full user journey:
  - Sign up → Buy Starter → Generate element → Buy Pro → Generate mockup → Gallery → Affiliate
- [ ] Test Mayar webhooks with Mayar test mode
- [ ] Test Polar webhooks with Polar test mode
- [ ] Deploy to production on Vercel

**Deliverable:** Production-ready, launch-ready app. 🚀

---

## Phase 9 — Post-Launch

- [ ] Prompt history in generator (last 5 prompts dropdown)
- [ ] "Generate Similar" button from gallery
- [ ] Batch mode — generate 4–8 elements at once as ZIP download
- [ ] More mockup scene presets based on user feedback
- [ ] International marketing (after Indonesia traction)
- [ ] Canva plugin
- [ ] SVG output option
