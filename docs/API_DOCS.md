# API Documentation — Folia (Final v3)

All routes under `/app/api/`.
Auth via Clerk (`currentUser()` server-side).
Responses are JSON.

---

## Auth Pattern

```typescript
import { currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

const user = await currentUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

const supabase = createServerClient()
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('clerk_user_id', user.id)
  .single()
```

---

## POST `/api/generate/elements`

Generate clipart element PNG with transparent background.

### Auth
Required — any tier with credits > 0.

### Tier Restrictions

| Feature | Starter | Pro | Business |
|---------|---------|-----|---------|
| Text-to-image | ✅ | ✅ | ✅ |
| Reference image (img2img) | ❌ | ✅ | ✅ |
| HD resolution (2048px) | ❌ | ✅ | ✅ |
| Variations > 1 | ❌ max 1 | ✅ max 4 | ✅ max 4 |

### Request Body
```typescript
{
  style: 'watercolor' | 'line_art' | 'cartoon' | 'boho' | 'minimalist',
  prompt: string,                      // required
  reference_image_r2_key?: string,     // optional — R2 key from /api/upload
  num_variations?: 1 | 2 | 3 | 4      // default 1; Starter forced to 1
}
```

### Response (200)
```typescript
{
  generation_id: string,
  results: Array<{
    r2_key: string,
    signed_url: string,               // valid 7 days
    index: number
  }>,
  credits_remaining: number,
  prompt_enhanced: string             // what Gemini produced (for transparency)
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Unauthorized |
| 403 | Not enough credits |
| 403 | Reference image requires Pro or Business |
| 422 | prompt is required |
| 422 | Invalid style |
| 500 | Generation failed. Please try again. |

### Internal Flow
```typescript
// 1. Auth + load profile
// 2. Validate inputs
// 3. Check tier restrictions
// 4. Check credits >= num_variations
// 5. LLM ENHANCE:
const enhancedPrompt = await enhancePrompt(
  prompt,
  STYLE_MODIFIERS[style],
  reference_image_r2_key ? getSignedR2Url(reference_image_r2_key) : undefined
)
// 6. GENERATE:
let result
try {
  result = await falClient.run('fal-ai/flux-pro', {
    input: { prompt: enhancedPrompt, num_images: num_variations, image_size: resolution }
  })
} catch {
  // FALLBACK
  result = await falClient.run('fal-ai/flux/dev', {
    input: { prompt: enhancedPrompt, num_images: num_variations }
  })
}
// 7. For each image: download → upload to R2
// 8. Insert into generations table
// 9. Decrement credits
// 10. Increment generation_counter
// 11. Return signed URLs
```

---

## POST `/api/generate/mockup`

Generate styled listing photo with uploaded invitation design.

### Auth
Required — **Pro or Business only**.

### Request Body
```typescript
{
  invitation_r2_key: string,           // required — from /api/upload
  scene_preset?: string,               // one of 6 preset keys
  custom_prompt?: string               // Pro/Business only
}
```

### Scene Preset Keys & Full Prompts

| Key | Full Scene Prompt |
|-----|-----------------|
| `marble-eucalyptus` | `This invitation card placed flat on a pristine white marble surface, fresh eucalyptus sprigs and small white flowers elegantly arranged around it, soft natural daylight from the side, top-down editorial photography, sharp focus, highly detailed, realistic` |
| `golden-plate` | `This invitation card placed on a decorative gold plate, surrounded by dried roses and eucalyptus branches, warm candlelight ambiance, top-down photography, luxurious aesthetic, soft shadows` |
| `floral-flatlay` | `This invitation card arranged in an elegant flat lay with fresh peonies, roses, and linen fabric background, light and airy photography style, overhead view, dreamy pastel tones` |
| `holiday-scene` | `This invitation card surrounded by fresh pine branches, gold and red christmas ornaments, fairy lights, warm cozy festive atmosphere, top-down photography` |
| `spooky-scene` | `This invitation card on a dark wooden table, carved halloween pumpkins and flickering candles around it, moody dark atmosphere, dramatic shadows, top-down view` |
| `party-table` | `This invitation card on a colorful festive party table, confetti, balloons, streamers surrounding it, bright cheerful lighting, celebration atmosphere, top-down photography` |

### Response (200)
```typescript
{
  generation_id: string,
  result: {
    r2_key: string,
    signed_url: string
  },
  credits_remaining: number
}
```

---

## POST `/api/upload`

Upload image to Cloudflare R2 before generation.

### Auth
Required.

### Request
`multipart/form-data`:
- `file` — image (JPEG, PNG, WEBP)
- `purpose` — `'reference'` | `'invitation'`

### Response (200)
```typescript
{
  r2_key: string,    // e.g. "uploads/user_xxx/1712345678-filename.png"
  size: number       // bytes
}
```

### Internal Flow
```typescript
// 1. Auth
// 2. Validate file type + size (max 10 MB)
// 3. Generate R2 key: uploads/{clerk_user_id}/{timestamp}-{original_name}
// 4. Upload to R2 via S3-compatible client
// 5. Return r2_key
```

---

## POST `/api/webhooks/mayar`

Handle Mayar payment webhooks (Indonesia).

### Auth
Verified via HMAC signature: `X-Mayar-Signature` header.

### Handled Events

#### `payment.success` (one-time: Starter or Top-up)
```typescript
// Idempotency check against payment_events table
// Add credits to profile
await supabase.from('profiles').update({
  credits: profile.credits + plan.credits,
  tier: plan.name,                     // update tier to 'starter'
}).eq('clerk_user_id', clerkUserId)

// Insert purchase record
// Send confirmation email via Resend
```

#### `subscription.created` (Pro or Business)
```typescript
// Add credits + update tier + subscription fields
await supabase.from('profiles').update({
  tier: plan,
  credits: profile.credits + plan.credits,
  subscription_status: 'active',
  subscription_period_end: nextBillingDate,
  mayar_customer_id: customerId,
  payment_provider: 'mayar',
}).eq('clerk_user_id', clerkUserId)
```

#### `subscription.renewed` (monthly renewal)
```typescript
// Add credits again for new billing cycle
await supabase.from('profiles').update({
  credits: profile.credits + plan.credits,
  subscription_period_end: nextBillingDate,
}).eq('clerk_user_id', clerkUserId)
```

#### `subscription.cancelled`
```typescript
// Do NOT remove credits immediately — let them use what they have
await supabase.from('profiles').update({
  subscription_status: 'canceled',
}).eq('clerk_user_id', clerkUserId)
// Send cancellation email
```

---

## POST `/api/webhooks/polar`

Handle Polar payment webhooks (International).

### Auth
Verified via Polar webhook secret.

### Handled Events
Same logic as Mayar webhooks but with Polar event names:
- `order.created` → add credits (one-time)
- `subscription.created` → subscribe
- `subscription.renewed` → add credits
- `subscription.revoked` → cancel

> Polar automatically handles VAT/tax for EU and US customers.

---

## POST `/api/affiliate/create`

Create affiliate code for Pro/Business user.

### Auth
Required — Pro or Business only.

### Response (200)
```typescript
{
  code: string,
  referral_url: string,     // https://folia.ai/?ref={code}
  stats: {
    clicks: number,
    conversions: number,
    credits_earned: number
  }
}
```

---

## GET `/api/affiliate/track`

Track affiliate click + set cookie.

### Query Params
- `code` — affiliate code
- `redirect` — optional redirect URL

### Response
- 302 redirect
- Sets cookie: `ref={code}; HttpOnly; Max-Age=2592000` (30 days)

---

## GET `/api/gallery/public`

Public community gallery — no auth required.

### Query Params
- `style` — optional filter: `watercolor | line_art | cartoon | boho | minimalist`
- `cursor` — pagination cursor (generation ID)
- `limit` — default 24

### Response (200)
```typescript
{
  items: Array<{
    id: string,
    signed_url: string,
    style: string,
    created_at: string
  }>,
  next_cursor: string | null
}
```

---

## Fal.ai Reference

### Models Used

| Model | Endpoint | Use Case |
|-------|----------|---------|
| `fal-ai/flux-pro` | `https://fal.run/fal-ai/flux-pro` | Primary element generation |
| `fal-ai/flux/dev` | `https://fal.run/fal-ai/flux/dev` | Fallback element generation |
| `fal-ai/flux-pro/kontext` | `https://fal.run/fal-ai/flux-pro/kontext` | Mockup scene generation |

### Headers
```
Authorization: Key {FAL_API_KEY}
Content-Type: application/json
```

### Cost Estimate
| Model | Cost per call |
|-------|-------------|
| Gemini 2.5 Flash Lite | low-cost |
| Fal.ai Flux Pro | ~$0.05 |
| Cloudflare R2 storage | ~$0.001 |
| **Total per generate** | **~$0.052 (~Rp 850)** |
