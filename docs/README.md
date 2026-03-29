# Folia — AI Clipart Generator for Invitation Designers

> Generate unique watercolor, cartoon, and illustrated clipart elements for any occasion.
> Built for Etsy sellers and digital product creators. Targeting Indonesia first, then US & Europe.

---

## What is Folia?

Folia generates professional PNG clipart elements with transparent backgrounds — any occasion, any style:

- 🌿 Wedding & Floral
- 🦕 Kids Birthday (dinosaurs, pandas, animals)
- 🎄 Christmas & Holiday
- 🎃 Halloween
- 💝 Valentine's Day
- 🍼 Baby Shower
- 🎉 Any occasion — open prompt system

**Two tools:**
1. **Element Generator** — type a prompt or upload a reference photo → get transparent PNG clipart
2. **Mockup Generator** — upload a finished invitation → get a professional styled listing photo

---

## Documentation

| File | Contents |
|------|---------|
| `docs/PRODUCT_SPEC.md` | Features, pricing, user journey, positioning |
| `docs/ARCHITECTURE.md` | Full tech stack, folder structure, all system flows |
| `docs/DATABASE_SCHEMA.md` | Supabase tables, RLS policies, triggers |
| `docs/API_DOCS.md` | All API routes with request/response schemas |
| `docs/ROADMAP.md` | 8 build phases with task checklists |
| `docs/BRAND_NAMES.md` | Brand name recommendations |
| `.env.example` | All required environment variables |

---

## Tech Stack (Final)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Storage | Cloudflare R2 |
| LLM Enhancer | Google Gemini 2.5 Flash Lite |
| Image AI | Fal.ai Flux Pro → Fal.ai Flux Dev (fallback) |
| Rate Limiting | Upstash Redis |
| Payment (Indonesia) | Mayar |
| Payment (International) | Polar |
| Email | Resend |
| Hosting | Vercel |

---

## Pricing

| Tier | Price | Credits | Notes |
|------|-------|---------|-------|
| Starter | Rp 15.000 | 8 credits | Entry point, no free tier |
| Pro | Rp 89.000/month | 40 credits | For active Etsy sellers |
| Business | Rp 159.000/month | 80 credits | For serious studios |
| Top-up | Rp 20.000 | 8 credits | Flexible, no subscription |

> No free tier — prevents account abuse common in Indonesia market.
> International USD pricing added in Phase 2 (after Indonesia traction).

---

## Generation Pipeline

```
User input (text prompt OR reference photo upload)
    ↓
Gemini 2.5 Flash Lite — LLM Enhancer
(analyze reference / enhance & optimize prompt)
    ↓
Fal.ai Flux Pro — Image Generator
(fallback: Fal.ai Flux Dev)
    ↓
Cloudflare R2 — Storage
    ↓
User downloads transparent PNG
```

---

## Security

- Fal.ai & Gemini API keys are **never exposed to browser** — server-side only
- Clerk handles all auth securely
- Cloudflare R2 — private bucket, signed URLs only
- Credits checked server-side before every generation
