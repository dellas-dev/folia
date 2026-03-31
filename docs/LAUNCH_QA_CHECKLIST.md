# Launch QA Checklist

## Pre-Launch Setup

- [ ] Production environment variables are set for Clerk, Supabase, R2, Fal, Groq, Mayar, and Polar
- [ ] `NEXT_PUBLIC_APP_URL` points to the production domain
- [ ] `docs/phase-6-affiliate-atomic-reward.sql` has been applied to production Supabase
- [ ] `docs/remove-bg-jobs.sql` has been applied to production Supabase
- [ ] Production webhooks are configured for Clerk, Mayar, and Polar
- [ ] Production R2 bucket credentials are valid
- [ ] Rate limiting environment variables are configured if used in production

## Marketing Pages

- [ ] `/` loads correctly in English
- [ ] `/` loads correctly in Indonesian
- [ ] Language switcher persists selected locale after reload
- [ ] `/pricing` renders correctly in English and Indonesian
- [ ] `/community` renders correctly in English and Indonesian
- [ ] `robots.txt` is reachable
- [ ] `sitemap.xml` is reachable
- [ ] Open Graph image route works
- [ ] Favicon loads without errors

## Auth And App Shell

- [ ] Sign up works for a new user
- [ ] Sign in works for an existing user
- [ ] Protected routes redirect unauthenticated users to sign in
- [ ] Dashboard renders correctly after sign in
- [ ] Credits badge and sidebar navigation render correctly on desktop and mobile

## Billing And Checkout

- [ ] Pricing page checkout buttons work for signed-in users
- [ ] IDR checkout opens the expected Mayar flow
- [ ] USD checkout opens the expected Polar flow
- [ ] Successful payment updates user credits
- [ ] Successful payment inserts a `purchases` row
- [ ] Replayed webhook for the same payment does not double-credit the user

## Affiliate Flow

- [ ] Pro or Business user can open `/affiliate`
- [ ] Starter user sees locked affiliate state
- [ ] Referral link copy action works
- [ ] Referral tracking sets the `ref` cookie
- [ ] New signup after referral stores `referred_by_code`
- [ ] Paid referral purchase increases affiliate conversions and credits earned
- [ ] Affiliate history entry is created after reward is awarded

## Element Generation

- [ ] Element generation works without reference image
- [ ] Reference image upload works for Pro and Business
- [ ] Starter cannot use reference image upload
- [ ] Prompt history stores successful prompts only
- [ ] `Generate similar` from gallery pre-fills prompt and style
- [ ] Business tier can request up to 8 variations
- [ ] Multi-result ZIP download works
- [ ] SVG export works and downloads an `.svg` file

## Mockup Generation

- [ ] Mockup page loads correctly
- [ ] Preset scene flow works
- [ ] Auto scene analysis flow works
- [ ] Additional mockup presets appear and generate successfully
- [ ] Mockup generation deducts credits exactly once per successful run

## Remove Background

- [ ] `/remove-bg` accepts local file upload
- [ ] Deep link `/remove-bg?r2_key=...` shows preview but does not auto-charge
- [ ] Remove background only runs after explicit confirmation
- [ ] Credits decrease by 1 after successful remove-bg job
- [ ] `remove_bg_jobs` audit row is created
- [ ] A user cannot process another user's `r2_key`

## Gallery

- [ ] Gallery lists user generations correctly
- [ ] Gallery empty state is correct for a new user
- [ ] Gallery empty state is correct when filters return zero results
- [ ] Public visibility toggle works
- [ ] Lightbox preview works
- [ ] Download links work

## Community Gallery

- [ ] Only approved public items appear on `/community`
- [ ] Style filters work correctly
- [ ] Empty state displays correctly when there are no public items

## Security Checks

- [ ] `/api/debug/r2` is not present in production
- [ ] Image analysis rejects foreign `r2_key`
- [ ] Element generation rejects foreign `reference_image_r2_key`
- [ ] Mockup generation rejects foreign `invitation_r2_key`
- [ ] Remove-bg rejects foreign `r2_key`

## UX Checks

- [ ] Toasts show for generation success and failure
- [ ] Toasts show for mockup success and failure
- [ ] Gallery loading skeleton appears during load
- [ ] Elements loading skeleton appears during load
- [ ] Mockups loading skeleton appears during load
- [ ] Marketing header and pricing table behave correctly on mobile

## Final Release Checks

- [ ] `npm run build` passes on the release commit
- [ ] No uncommitted local changes remain before release
- [ ] All required migrations/docs have been applied
- [ ] Branch is ready for PR or deployment

## Recommended Manual Test Accounts

- [ ] Starter account with low credits
- [ ] Pro account with affiliate access
- [ ] Business account for 8-variation batch generation
- [ ] Fresh referred signup account
