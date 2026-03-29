# Product Specification — Folia (Final v3)

> AI Clipart Generator for Digital Invitation Designers
> Version: 1.0 MVP | Market: Indonesia first → US & Europe

---

## 1. Product Overview

Folia generates professional PNG clipart elements with transparent backgrounds for Etsy sellers and digital product creators — any occasion, any style, in seconds.

### Problem We Solve

Etsy sellers who create digital invitation templates constantly need custom illustration elements. Current options:
1. Buy clipart packs — $10–30/pack, limited commercial license
2. Hire illustrators — $50–300/set, takes days/weeks
3. Free resources — oversaturated, no exclusivity

**Folia generates unique, commercial-ready clipart on demand.**

---

## 2. Target Users

### Primary
- Etsy sellers creating digital invitation templates
- Creative Market / Design Bundles creators
- Freelance designers making custom invitations

### Demographics
- Women age 25–45, work from home
- Tools: Canva, Adobe Illustrator, Procreate, Photoshop
- Active in Etsy seller communities, Pinterest, Facebook groups

### Market Rollout
- **Phase 1:** 🇮🇩 Indonesia (launch market)
- **Phase 2:** 🇺🇸 US · 🇬🇧 UK · 🇦🇺 Australia · 🇪🇺 Western Europe

---

## 3. Core Features

### 3.1 Element Generator — PRIMARY FEATURE (Tab 1)

Generates PNG clipart with transparent background.

#### Generation Pipeline (Internal)

```
User input (text prompt OR reference photo)
    ↓
Gemini 2.5 Flash Lite — LLM Enhancer
• Analyze reference photo style (if uploaded)
• Enhance & optimize user prompt
• Auto-inject: style modifier + transparent bg + no text
    ↓
Fal.ai Flux Pro — Image Generator
• Fallback: Fal.ai Flux Dev (if Flux Pro fails)
    ↓
Cloudflare R2 — Store result PNG
    ↓
Return signed URL to user
```

#### User Inputs

| Input | Type | Description |
|-------|------|-------------|
| Style | Single select | 5 illustration styles |
| Prompt | Text area | Free description — any language, any occasion |
| Reference Image | File upload | Upload existing clipart → generate similar style |
| Variations | 1–4 | Number of outputs (Starter: 1 only, Pro/Business: up to 4) |

#### 5 Illustration Styles

| Style | Modifier Sent to AI | Best For |
|-------|-------------------|---------|
| 🎨 Watercolor | `soft watercolor painting, delicate brush strokes, hand-painted, translucent layers` | Wedding, baby shower, floral |
| ✏️ Line Art | `clean vector line art, black outline only, no fill, coloring book style` | Minimalist, DIY templates |
| 🐼 Cartoon / Kawaii | `cute kawaii cartoon illustration, rounded shapes, big sparkly eyes, pastel colors, chibi style` | Kids birthday, baby shower |
| 🌾 Boho / Vintage | `bohemian vintage illustration, earthy tones, aged texture, folk art style, rustic` | Boho wedding, rustic party |
| ⬜ Minimalist / Flat | `minimalist flat design, simple geometric shapes, clean lines, modern, bold colors` | Modern wedding, corporate |

#### LLM Enhancer — How It Works

```
System prompt to Gemini:
"You are a clipart prompt specialist for invitation designers.
Transform any user input into an optimized image generation prompt.
Always ensure output will be: transparent PNG, isolated element,
no text, no letters, professional clipart quality, commercial use ready.
If a reference image is provided, analyze its art style, color palette,
brush technique, and reproduce those characteristics in the prompt."

Example:
User types: "panda lucu"
Style: Cartoon/Kawaii
Gemini output: "Adorable baby panda sitting, holding bamboo stick,
cute kawaii cartoon illustration, rounded shapes, big sparkly eyes,
soft pastel colors, chibi style, transparent background, isolated element,
no text, PNG clipart, professional illustration, commercial use ready"
→ This goes to Fal.ai Flux Pro
```

#### Output Specs

| Tier | Resolution | Watermark | Variations |
|------|-----------|-----------|-----------|
| Starter | 1024×1024 px | No | 1 only |
| Pro | 2048×2048 px | No | Up to 4 |
| Business | 2048×2048 px | No | Up to 4 |

> No watermark on any tier — even Starter pays, so they get clean output.

---

### 3.2 Mockup Generator — SECONDARY FEATURE (Tab 2)

Place finished invitation designs into styled real-world scenes for Etsy listing photos.

#### 6 Scene Presets

| Preset | Scene | Tier Access |
|--------|-------|------------|
| 🍃 Marble & Eucalyptus | White marble, eucalyptus, natural light, top-down | All |
| 🌕 Golden Plate | Gold plate, dried flowers, candlelight | All |
| 🌸 Floral Flat Lay | Peonies, roses, linen, airy photography | All |
| 🎄 Holiday Scene | Pine branches, ornaments, fairy lights | Pro + Business |
| 🎃 Spooky Scene | Dark table, pumpkins, candles | Pro + Business |
| 🎈 Party Table | Confetti, balloons, festive table | Pro + Business |

Custom scene prompt: Pro + Business only.

**AI Model:** `fal-ai/flux-pro/kontext`

---

### 3.3 Community Gallery (Public)

- Public grid of user-generated elements (opt-in when downloading)
- Benefits: SEO traffic, social proof for new visitors
- Real-time counter: "127,483 elements generated" — builds trust & FOMO
- Filter by style, occasion

---

### 3.4 Gallery (Personal History)

- Personal grid of all past generations
- Filter: Elements / Mockups / Style
- Re-download anytime
- Retention: 30 days (Starter/Top-up) · 90 days (Pro) · Unlimited (Business)

---

### 3.5 Affiliate / Referral Program

- Available to Pro & Business users
- Unique referral link per user
- Earn credits (not cash) for referred paying users:
  - Referred user buys Starter → referrer gets 5 credits
  - Referred user subscribes Pro → referrer gets 20 credits/month
  - Referred user subscribes Business → referrer gets 40 credits/month
- Credit-based (simpler than cash payout for Indonesia market)

> Note: Switch to cash commission (20–25%) when launching international via Polar.

---

## 4. Pricing (Final — Indonesia Market)

### No Free Tier
Prevents account abuse (creating new accounts for free credits — common in Indonesia).
Entry point is Starter at Rp 15.000 — barrier low enough for anyone serious.

| Tier | Price | Credits | Per Credit Cost | Profit/Package |
|------|-------|---------|----------------|---------------|
| Starter | Rp 15.000 | 8 credits | Rp 1.875 | Rp 8.200 |
| Pro | Rp 89.000/month | 40 credits | Rp 2.225 | Rp 55.000 |
| Business | Rp 159.000/month | 80 credits | Rp 1.988 | Rp 91.000 |
| Top-up | Rp 20.000 | 8 credits | Rp 2.500 | Rp 13.200 |

> AI cost per generate: ~Rp 850 (Gemini + Fal.ai + R2)
> Top-up is most expensive per credit → encourages Pro subscription

### Feature Comparison

| Feature | Starter | Pro | Business |
|---------|---------|-----|---------|
| Element Generator | ✅ | ✅ | ✅ |
| Mockup Generator | ❌ | ✅ | ✅ |
| Reference image upload | ❌ | ✅ | ✅ |
| Output resolution | 1024px | 2048px | 2048px |
| Watermark | None | None | None |
| Variations per gen | 1 | Up to 4 | Up to 4 |
| Scene presets | 3 of 6 | All 6 | All 6 |
| Custom scene prompt | ❌ | ✅ | ✅ |
| Gallery retention | 30 days | 90 days | Unlimited |
| Affiliate/referral | ❌ | ✅ | ✅ |
| Priority queue | ❌ | ❌ | ✅ |

### Payment Gateways

| Gateway | Market | Methods |
|---------|--------|---------|
| **Mayar** | 🇮🇩 Indonesia | QRIS, Transfer Bank, GoPay, OVO, ShopeePay, Credit Card |
| **Polar** | 🌍 International | Credit Card, PayPal, Apple Pay, Google Pay |

> Stripe: NOT used — Mayar + Polar covers all markets with less complexity.

### International Pricing (Phase 2 — after Indonesia traction)

| Tier | USD Price | Credits |
|------|-----------|---------|
| Starter | $1.99 | 8 credits |
| Pro | $9.99/month | 40 credits |
| Business | $19.99/month | 80 credits |
| Top-up | $2.99 | 8 credits |

---

## 5. Key UX Principles

1. **Style first** — pick style card before writing prompt
2. **Rotating prompt examples** — any occasion: "cute panda with balloons", "eucalyptus branch", "jack-o-lantern with spider web"
3. **LLM does the heavy lifting** — user writes naturally, Gemini optimizes
4. **One-click download** — zero friction
5. **Real-time counter** — show total elements generated (social proof)
6. **Community gallery** — public showcase, browsable without login

---

## 6. Out of Scope — MVP v1.0

- ❌ Vector / SVG output
- ❌ Text overlay / invitation builder
- ❌ Background remover
- ❌ Team workspaces
- ❌ API access
- ❌ Canva plugin
- ❌ Animated elements
- ❌ Bulk / batch generation (Phase 2)
