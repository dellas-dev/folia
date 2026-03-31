# End-to-End QA Flow

## 1. New Visitor To Paid User

1. Open `/`
2. Switch language from `EN` to `ID`
3. Open `/pricing`
4. Sign up
5. Complete a checkout flow
6. Confirm credits appear in `/dashboard`

Expected:
- Marketing pages render correctly in both locales
- Auth succeeds
- Payment succeeds
- Credits update after payment

## 2. Element Generation Flow

1. Open `/elements`
2. Generate one result without a reference image
3. Generate again with multiple variations on Business tier
4. Download a single image
5. Download ZIP for multi-result run
6. Export SVG from one result

Expected:
- Credits decrement correctly
- Results render correctly
- ZIP contains all expected files
- SVG export downloads successfully

## 3. Gallery To Follow-Up Action Flow

1. Open `/gallery`
2. Open a generation preview
3. Click `Generate similar`
4. Confirm prompt and style are prefilled in `/elements`
5. Return to gallery and toggle public visibility

Expected:
- Gallery preview works
- Prefill works
- Public toggle persists

## 4. Mockup Flow

1. Open `/mockups`
2. Upload invitation artwork
3. Generate with a preset scene
4. Generate with auto scene mode

Expected:
- Upload works
- Preset and auto modes both generate
- Credits decrement correctly

## 5. Remove Background Flow

1. Open `/remove-bg`
2. Upload an image manually
3. Confirm remove background
4. Download PNG result
5. Open `/remove-bg?r2_key=<owned-key>`
6. Confirm the page does not auto-run
7. Manually trigger processing

Expected:
- No auto-charge on deep link
- Explicit action required before credit spend
- Audit row is created in `remove_bg_jobs`

## 6. Affiliate Flow

1. Sign in as Pro or Business user
2. Open `/affiliate`
3. Copy referral link
4. Open referral link in fresh browser session
5. Sign up new user
6. Purchase a paid plan as the referred user

Expected:
- Referral cookie is set
- Referred profile stores referral code
- Affiliate stats and history update after purchase

## 7. Security Regression Checks

1. Try calling image-analysis and generation flows with a foreign `r2_key`
2. Try using `/mockups?r2_key=<foreign-key>`
3. Try using `/remove-bg?r2_key=<foreign-key>`

Expected:
- Requests are rejected or ignored
- Foreign assets never preview or process

## 8. Replay And Idempotency Checks

1. Re-send a successful payment webhook for the same payment
2. Re-open remove-bg deep link multiple times

Expected:
- Purchase is not double-applied
- Remove-bg does not auto-charge on page load
