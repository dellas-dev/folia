---
name: Go-Live Checklist
about: Track production launch readiness for Folia
title: "Go Live: Production Readiness"
labels: ["ops", "release"]
assignees: []
---

## Summary

- Target domain: `https://folia.studiocreative.id`
- Planned deploy window:
- Owner:
- Hosting target:

## Current Status

| Area | Item | Status | Notes |
| --- | --- | --- | --- |
| Kode aplikasi | Build production lulus | Siap / Belum | |
| Kode aplikasi | Typecheck lulus | Siap / Belum | |
| App URL | `NEXT_PUBLIC_APP_URL` production benar | Siap / Belum | |
| Clerk | Live keys sudah dipakai | Siap / Belum | |
| Clerk | Domain dan webhook production benar | Manual Check | |
| Supabase | Project production dan schema benar | Manual Check | |
| R2 | Bucket dan credential production benar | Manual Check | |
| AI Provider | Groq dan Fal aktif | Siap / Belum | |
| Upstash | Instance aktif | Manual Check | |
| Mayar | Mode production dan webhook benar | Manual Check | |
| Polar | Mode production dan webhook benar | Manual Check | |
| Resend | Sender verified | Manual Check | |
| Hosting dan DNS | Env, DNS, HTTPS benar | Manual Check | |
| Smoke test | Semua smoke test lulus | Belum dikerjakan / Lulus / Gagal | |

## Pre-Flight Local

- [ ] `npm run build`
- [ ] `npx tsc --noEmit`
- [ ] Audit `localhost`, `accounts.dev`, dan `NEXT_PUBLIC_APP_URL`
- [ ] Pastikan route webhook Clerk, Mayar, dan Polar tersedia
- [ ] Cocokkan schema inti dengan `docs/migration.sql`

## Env Production

- [ ] `NEXT_PUBLIC_APP_URL=https://folia.studiocreative.id`
- [ ] Tidak ada spasi pada assignment env
- [ ] Clerk memakai `pk_live_...`
- [ ] Clerk memakai `sk_live_...`
- [ ] `NEXT_PUBLIC_CLERK_JS_URL` dihapus bila tidak wajib
- [ ] Supabase production env benar
- [ ] R2 production env benar
- [ ] Groq dan Fal env benar
- [ ] Upstash env benar
- [ ] Mayar env dan product ID benar
- [ ] Polar env dan product ID benar
- [ ] Resend env dan sender benar

## Dashboard Manual Checks

- [ ] Domain `folia.studiocreative.id` sudah ditambahkan di Clerk
- [ ] Webhook Clerk menuju `https://folia.studiocreative.id/api/webhooks/clerk`
- [ ] Supabase yang dipakai benar-benar project production
- [ ] Tabel `profiles`, `generations`, `purchases`, `payment_events`, `affiliates`, dan `affiliate_referrals` tersedia
- [ ] Bucket R2 production benar
- [ ] Quota Groq dan Fal aman
- [ ] Upstash dapat diakses dari hosting production
- [ ] Mayar mode production
- [ ] Webhook Mayar menuju `https://folia.studiocreative.id/api/webhooks/mayar`
- [ ] Polar token live
- [ ] Webhook Polar menuju `https://folia.studiocreative.id/api/webhooks/polar`
- [ ] Domain atau sender Resend sudah verified

## Deploy

- [ ] Update env production di hosting
- [ ] Jalankan deploy production terbaru
- [ ] Pastikan domain custom menunjuk ke deploy terbaru
- [ ] Pastikan HTTPS aktif

## Post-Deploy Terminal Checks

- [ ] `curl -I https://folia.studiocreative.id`
- [ ] `curl -I https://folia.studiocreative.id/robots.txt`
- [ ] `curl -I https://folia.studiocreative.id/sitemap.xml`
- [ ] Audit `.next` terhadap `localhost` atau `accounts.dev` bila diperlukan

## Smoke Test Production

- [ ] Signup user baru
- [ ] Row `profiles` terbentuk
- [ ] Upload gambar
- [ ] Generate element
- [ ] Remove background
- [ ] Generate mockup
- [ ] Checkout IDR
- [ ] Checkout USD
- [ ] Webhook payment sukses
- [ ] Email terkirim
- [ ] `robots.txt` dan `sitemap.xml` valid
- [ ] Tidak ada `localhost` di production
- [ ] Console browser bersih

## Go / No-Go

- [ ] GO
- [ ] NO-GO

## Risks / Blockers

- 

## Notes

- Referensi utama: `docs/GO_LIVE_CHECKLIST.md`
- Referensi env: `docs/PRODUCTION_ENV_CHECKLIST.md`
