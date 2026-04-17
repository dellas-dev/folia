# Production Env Checklist

Target domain: `https://folia.studiocreative.id`

This checklist is specific to the current codebase. It covers the environment variables and provider-side settings that must be ready before deploying production.

For the full execution runbook from pre-flight to smoke test, use [docs/GO_LIVE_CHECKLIST.md](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/docs/GO_LIVE_CHECKLIST.md:1).

## 1. App URL

- Set `NEXT_PUBLIC_APP_URL=https://folia.studiocreative.id`
- This value is used by:
  - `app/layout.tsx` for `metadataBase`
  - `app/sitemap.ts`
  - `app/robots.ts`
  - `lib/affiliate.ts`
  - `lib/payments/mayar.ts`
  - `lib/payments/polar.ts`

If this is left as `localhost`, production metadata, sitemap, robots, affiliate links, and payment redirects will be wrong.

## 2. Clerk

Required variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`

Production rules:

- Use `pk_live_...` and `sk_live_...` keys, not test keys.
- Remove `NEXT_PUBLIC_CLERK_JS_URL` unless you specifically need a custom Clerk JS host in production.
- In Clerk dashboard, add `folia.studiocreative.id` as an allowed production domain.

Webhook target:

- `https://folia.studiocreative.id/api/webhooks/clerk`

Verify after setup:

- Sign up creates or updates a row in `profiles`.
- Sign in redirects to `/dashboard`.
- No Clerk development warning appears in browser console.

## 3. Supabase

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Production rules:

- Use the real production project values.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-only.
- Confirm the `profiles`, `generations`, `purchases`, `affiliates`, and `affiliate_referrals` tables exist and match the current schema.

Verify after setup:

- Existing users can load `/dashboard`.
- New users can sign up and get a `profiles` row.
- No `[auth] Profile fetch failed` errors appear in server logs.

## 4. Cloudflare R2

Required variables:

- `CF_ACCOUNT_ID`
- `CF_R2_ACCESS_KEY_ID`
- `CF_R2_SECRET_ACCESS_KEY`
- `CF_R2_BUCKET_NAME`
- `CF_R2_PUBLIC_URL` if you rely on a public bucket URL anywhere external

Production rules:

- Bucket must exist and allow signed URL access as expected by `lib/r2/client.ts`.
- Confirm the runtime can upload and fetch generated images.

Verify after setup:

- `/api/upload` succeeds.
- Elements, Remove BG, and Mockups can save outputs and later re-open them.

## 5. Groq

Required variable:

- `GROQ_API_KEY`

Production rules:

- The app currently uses `GROQ_API_KEY` in `lib/gemini/enhancer.ts`.
- `GEMINI_API_KEY` is not used by the current codepath.

Verify after setup:

- Reference image analysis works.
- Prompt enhancement works.
- Mockup auto-scene analysis works.

## 6. Fal

Required variable:

- `FAL_API_KEY`

Production rules:

- Must be valid for:
  - elements generation
  - mockup generation
  - background removal

Verify after setup:

- `/api/generate/elements` returns `200`
- `/api/generate/mockup` returns `200`
- `/api/remove-bg` returns `200`

## 7. Upstash Redis

Required variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Production rules:

- These power rate limiting in `lib/upstash/ratelimit.ts`.
- If omitted, rate limiting behavior changes and protection is effectively disabled.

Verify after setup:

- Burst requests eventually return `429` instead of crashing.

## 8. Mayar

Required variables:

- `MAYAR_API_KEY`
- `MAYAR_WEBHOOK_SECRET`
- `MAYAR_STARTER_PRODUCT_ID`
- `MAYAR_PRO_PRODUCT_ID`
- `MAYAR_BUSINESS_PRODUCT_ID`
- `MAYAR_TOPUP_PRODUCT_ID`

Provider settings:

- Redirect URL used by the code:
  - `https://folia.studiocreative.id/settings/billing`

Webhook target:

- `https://folia.studiocreative.id/api/webhooks/mayar`

Production rules:

- Confirm Mayar account mode is production, not sandbox/test.
- Confirm all product IDs match the correct plan mapping in `lib/plans.ts`.

Verify after setup:

- IDR checkout opens correctly.
- Successful payment updates credits or plan.

## 9. Polar

Required variables:

- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_STARTER_PRODUCT_ID`
- `POLAR_PRO_PRODUCT_ID`
- `POLAR_BUSINESS_PRODUCT_ID`
- `POLAR_TOPUP_PRODUCT_ID`

Provider settings:

- Success URL used by the code:
  - `https://folia.studiocreative.id/settings/billing?success=1&checkout_id={CHECKOUT_ID}`
- Return URL used by the code:
  - `https://folia.studiocreative.id/pricing`

Webhook target:

- `https://folia.studiocreative.id/api/webhooks/polar`

Production rules:

- Do not use `polar_sandbox...` tokens in production.
- Confirm products map to the intended plan.

Verify after setup:

- USD checkout opens correctly.
- Successful purchase updates credits or subscription state.

## 10. Resend

Required variables:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Production rules:

- Domain or sender must be verified in Resend.
- `RESEND_FROM_EMAIL` should be a verified sender on `folia.studiocreative.id`.

Verify after setup:

- Checkout email sends successfully from `app/api/payments/checkout/route.ts`.

## 11. DNS and Hosting

Before go-live, confirm:

- `folia.studiocreative.id` points to the production host.
- HTTPS is active.
- The hosting platform has all production env vars set.
- Old preview or localhost env vars are not reused in production.

## 12. Handoff To Go-Live Runbook

After all env and provider checks above are complete, continue with:

- Deploy steps
- Post-deploy terminal checks
- Full production smoke test
- Final `GO / NO-GO`

Use [docs/GO_LIVE_CHECKLIST.md](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/docs/GO_LIVE_CHECKLIST.md:1) as the main execution checklist.

## 13. Not Ready If Any Of These Are Still True

- `NEXT_PUBLIC_APP_URL` still points to `localhost`
- Clerk still uses `pk_test_...` or `sk_test_...`
- `NEXT_PUBLIC_CLERK_JS_URL` still points to `accounts.dev` without a production reason
- Polar uses sandbox credentials
- Payment webhook URLs still point to preview or localhost
- Resend sender domain is not verified
- Supabase profile fetch fails intermittently in production
