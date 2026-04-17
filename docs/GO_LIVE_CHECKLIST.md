# Go-Live Checklist

Target domain: `https://folia.studiocreative.id`

Dokumen ini adalah runbook praktis untuk membawa Folia ke production. Fokusnya bukan hanya env, tetapi urutan kerja dari audit lokal, update dashboard provider, deploy, sampai smoke test live.

Referensi pendukung:

- [docs/PRODUCTION_ENV_CHECKLIST.md](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/docs/PRODUCTION_ENV_CHECKLIST.md:1)
- [docs/migration.sql](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/docs/migration.sql:1)
- [docs/env.example](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/docs/env.example:1)

## Quick Checklist

- [ ] `npm run build` lulus
- [ ] `npx tsc --noEmit` lulus
- [ ] `NEXT_PUBLIC_APP_URL=https://folia.studiocreative.id` tanpa spasi
- [ ] Clerk memakai live keys
- [ ] `NEXT_PUBLIC_CLERK_JS_URL` dihapus di production jika tidak dibutuhkan
- [ ] Domain production sudah terdaftar di Clerk
- [ ] Webhook Clerk mengarah ke production
- [ ] Supabase production dan schema sudah cocok
- [ ] R2 production bucket sudah benar
- [ ] Groq dan Fal aktif
- [ ] Upstash aktif
- [ ] Mayar production dan webhook benar
- [ ] Polar production dan webhook benar
- [ ] Resend sender sudah verified
- [ ] Deploy production sukses
- [ ] DNS dan HTTPS normal
- [ ] Signup production lulus
- [ ] Upload, generate, remove-bg, dan mockup lulus
- [ ] Checkout IDR dan USD lulus
- [ ] Webhook payment sukses
- [ ] Email production terkirim
- [ ] `robots.txt`, `sitemap.xml`, dan browser console bersih

## Status Matrix

Gunakan tabel ini sebagai ringkasan status sebelum mengeksekusi live:

| Area | Item | Status | Notes |
| --- | --- | --- | --- |
| Kode aplikasi | Build production lulus | Siap / Belum | |
| Kode aplikasi | Typecheck lulus | Siap / Belum | |
| Kode aplikasi | Route debug publik sudah dihapus | Siap / Belum | |
| Kode aplikasi | Validasi ownership `r2_key` aktif | Siap / Belum | |
| Kode aplikasi | Guard checkout Mayar aktif | Siap / Belum | |
| Kode aplikasi | Hardening webhook payment aktif | Siap / Belum | |
| App URL | `NEXT_PUBLIC_APP_URL` production benar | Siap / Belum | Harus `https://folia.studiocreative.id` |
| Clerk | Publishable key live | Siap / Belum | |
| Clerk | Secret key live | Siap / Belum | |
| Clerk | Webhook secret terisi | Siap / Belum | |
| Clerk | `NEXT_PUBLIC_CLERK_JS_URL` dihapus bila tidak diperlukan | Siap / Belum | |
| Clerk | Domain production terdaftar di Clerk | Manual Check | |
| Clerk | Webhook Clerk menuju production | Manual Check | |
| Supabase | URL, anon key, service role benar | Siap / Belum | |
| Supabase | Project yang dipakai adalah production | Manual Check | |
| Supabase | Tabel inti sesuai schema | Manual Check | `profiles`, `generations`, `purchases`, `payment_events`, `affiliates`, `affiliate_referrals` |
| Cloudflare R2 | Credential dan bucket benar | Siap / Belum | |
| Cloudflare R2 | Bucket production cocok dengan flow app | Manual Check | |
| AI Provider | Groq aktif | Siap / Belum | |
| AI Provider | Fal aktif | Siap / Belum | |
| AI Provider | Quota provider aman | Manual Check | |
| Upstash | URL dan token valid | Siap / Belum | |
| Upstash | Instance aktif dari production | Manual Check | |
| Mayar | API key, webhook secret, product ID valid | Siap / Belum | |
| Mayar | Account di mode production | Manual Check | |
| Mayar | Webhook menuju production | Manual Check | |
| Polar | Access token, webhook secret, product ID valid | Siap / Belum | |
| Polar | Token benar-benar live | Manual Check | |
| Polar | Webhook menuju production | Manual Check | |
| Resend | API key dan sender benar | Siap / Belum | |
| Resend | Domain atau sender verified | Manual Check | |
| Hosting dan DNS | Env production sudah terpasang | Manual Check | |
| Hosting dan DNS | DNS menunjuk ke deploy terbaru | Manual Check | |
| Hosting dan DNS | HTTPS aktif | Manual Check | |
| Smoke test | Signup user baru | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | `profiles` row terbentuk | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Upload gambar | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Generate element | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Remove background | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Generate mockup | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Checkout IDR | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Checkout USD | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Webhook payment sukses | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Email terkirim | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | `robots.txt` dan `sitemap.xml` benar | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Tidak ada `localhost` di production | Belum dikerjakan / Lulus / Gagal | |
| Smoke test | Console browser bersih | Belum dikerjakan / Lulus / Gagal | |

## 1. Pre-Flight Local

Jalankan semua command ini dari root project:

```bash
npm run build
npx tsc --noEmit
rg -n "localhost:3000|accounts.dev|NEXT_PUBLIC_APP_URL|NEXT_PUBLIC_CLERK_JS_URL" .env.local app lib docs
rg -n "api/webhooks/clerk|api/webhooks/mayar|api/webhooks/polar" app docs
rg -n "create table if not exists public\\.(profiles|generations|purchases|payment_events|affiliates|affiliate_referrals)" docs/migration.sql
```

Checklist lulus:

- [ ] `npm run build` berhasil tanpa error
- [ ] `npx tsc --noEmit` berhasil tanpa error
- [ ] Tidak ada referensi debug atau URL development yang tersisa tanpa alasan yang jelas
- [ ] Route webhook Clerk, Mayar, dan Polar memang ada di aplikasi
- [ ] Schema penting production ada di [docs/migration.sql](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/docs/migration.sql:1)

## 2. Rapikan Nilai Env Sebelum Deploy

Pastikan env production di dashboard hosting mengikuti format berikut:

```bash
NEXT_PUBLIC_APP_URL=https://folia.studiocreative.id
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
RESEND_FROM_EMAIL=hello@folia.studiocreative.id
```

Catatan penting:

- Jangan sisakan spasi pada assignment env, misalnya `NEXT_PUBLIC_APP_URL= https://...`
- Jangan pakai `pk_test_...` atau `sk_test_...` untuk Clerk production
- Hapus `NEXT_PUBLIC_CLERK_JS_URL` di production kecuali Clerk memang meminta host custom
- Pastikan `NEXT_PUBLIC_APP_URL` sama persis dengan domain live

Checklist lulus:

- [ ] `NEXT_PUBLIC_APP_URL` exact dan tanpa spasi
- [ ] Clerk production tidak memakai test keys
- [ ] `NEXT_PUBLIC_CLERK_JS_URL` tidak dipakai tanpa alasan production yang jelas
- [ ] Path auth dan sender email production sudah benar

## 3. Update Env Production di Hosting

Isi dan verifikasi variabel berikut di dashboard hosting production:

- App: `NEXT_PUBLIC_APP_URL`
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- R2: `CF_ACCOUNT_ID`, `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`, `CF_R2_BUCKET_NAME`, `CF_R2_PUBLIC_URL`
- AI: `GROQ_API_KEY`, `FAL_API_KEY`
- Upstash: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Mayar: `MAYAR_API_KEY`, `MAYAR_WEBHOOK_SECRET`, `MAYAR_STARTER_PRODUCT_ID`, `MAYAR_PRO_PRODUCT_ID`, `MAYAR_BUSINESS_PRODUCT_ID`, `MAYAR_TOPUP_PRODUCT_ID`
- Polar: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_STARTER_PRODUCT_ID`, `POLAR_PRO_PRODUCT_ID`, `POLAR_BUSINESS_PRODUCT_ID`, `POLAR_TOPUP_PRODUCT_ID`
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

Checklist lulus:

- [ ] Semua env server-only benar-benar hanya disimpan di hosting
- [ ] Tidak ada secret yang tertukar antara test dan production
- [ ] Product ID Mayar dan Polar sesuai mapping plan di [lib/plans.ts](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/lib/plans.ts:1)

## 4. Provider Dashboard Manual Checks

### Clerk

- Gunakan `pk_live_...` dan `sk_live_...`
- Tambahkan `folia.studiocreative.id` sebagai production domain
- Pastikan webhook mengarah ke `https://folia.studiocreative.id/api/webhooks/clerk`
- Pastikan sign-in dan sign-up flow tetap menuju `/dashboard`
- [ ] Clerk dashboard production sudah benar

### Supabase

- Pastikan ini project production, bukan staging atau sandbox
- Pastikan tabel `profiles`, `generations`, `purchases`, `payment_events`, `affiliates`, dan `affiliate_referrals` ada
- Cocokkan schema dengan [docs/migration.sql](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/docs/migration.sql:1)
- [ ] Supabase production dan schema sudah benar

### Cloudflare R2

- Pastikan bucket production benar
- Pastikan credentials dapat upload dan read ulang file
- Pastikan flow signed URL bekerja sesuai implementasi di [lib/r2/client.ts](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/lib/r2/client.ts:1)
- [ ] R2 production siap dipakai

### Groq dan Fal

- Pastikan kuota masih aktif
- Pastikan akun provider tidak suspended
- Pastikan request dari hosting production diperbolehkan
- [ ] Provider AI siap dipakai

### Upstash

- Pastikan instance aktif
- Pastikan REST URL dan token valid
- Pastikan hosting production dapat mengakses Upstash
- [ ] Upstash siap dipakai

### Mayar

- Pastikan account berada di mode production
- Pastikan semua product ID benar untuk `starter`, `pro`, `business`, dan `topup`
- Pastikan webhook mengarah ke `https://folia.studiocreative.id/api/webhooks/mayar`
- Pastikan redirect selesai bayar mengarah ke `/settings/billing`
- [ ] Mayar production siap dipakai

### Polar

- Pastikan token bukan sandbox
- Pastikan semua product ID benar
- Pastikan webhook mengarah ke `https://folia.studiocreative.id/api/webhooks/polar`
- Pastikan success URL dan return URL sesuai domain production
- [ ] Polar production siap dipakai

### Resend

- Pastikan domain atau sender `hello@folia.studiocreative.id` sudah verified
- Pastikan akun Resend production masih aktif
- [ ] Resend production siap dipakai

## 5. Deploy Production

Urutan yang disarankan:

1. Update semua env production di dashboard hosting.
2. Simpan perubahan env.
3. Jalankan deploy production terbaru.
4. Tunggu build hosting selesai.
5. Pastikan domain custom menunjuk ke deploy terbaru.

Checklist lulus:

- [ ] Deploy production selesai tanpa error
- [ ] Domain `folia.studiocreative.id` membuka build terbaru
- [ ] HTTPS aktif
- [ ] DNS sudah propagate dengan benar

## 6. Terminal Checks Setelah Deploy

Jalankan dari terminal lokal:

```bash
curl -I https://folia.studiocreative.id
curl -I https://folia.studiocreative.id/robots.txt
curl -I https://folia.studiocreative.id/sitemap.xml
curl -s https://folia.studiocreative.id/robots.txt
curl -s https://folia.studiocreative.id/sitemap.xml | head
```

Kalau ingin audit artefak build lokal terhadap sisa URL development:

```bash
rg -n "localhost:3000|accounts.dev" .next
```

Checklist lulus:

- [ ] Homepage merespons `200`
- [ ] `robots.txt` tersedia
- [ ] `sitemap.xml` tersedia
- [ ] Tidak ada referensi `localhost` atau `accounts.dev` yang bocor ke build production tanpa alasan

## 7. Smoke Test Production

Lakukan pengujian manual ini di browser pada domain live:

1. Sign up user baru.
2. Pastikan row `profiles` terbentuk di Supabase.
3. Sign in dan pastikan redirect ke `/dashboard`.
4. Upload gambar referensi atau invitation.
5. Generate element.
6. Remove background.
7. Generate mockup.
8. Jalankan checkout IDR.
9. Jalankan checkout USD.
10. Pastikan webhook payment sukses memproses update plan atau credits.
11. Pastikan email checkout atau konfirmasi terkirim.
12. Buka `robots.txt` dan `sitemap.xml`.
13. Cek tidak ada string `localhost` yang tampil di UI, metadata, redirect, atau payment flow.
14. Cek browser console bersih dari error yang relevan.

Checklist lulus:

- [ ] User baru bisa masuk tanpa error auth
- [ ] `profiles` tersinkron dari Clerk webhook
- [ ] Upload ke R2 sukses
- [ ] Element generation sukses
- [ ] Remove background sukses
- [ ] Mockup generation sukses
- [ ] Checkout IDR sukses
- [ ] Checkout USD sukses
- [ ] Payment webhook mengupdate data dengan benar
- [ ] Email terkirim dari sender production

## 8. Fokus Risiko Yang Harus Dicek Ulang

Prioritas tertinggi sebelum live:

- `NEXT_PUBLIC_APP_URL` harus exact dan tanpa spasi
- Clerk harus memakai live keys
- `NEXT_PUBLIC_CLERK_JS_URL` sebaiknya dihapus di production
- Domain production harus sudah terdaftar di Clerk
- Webhook Clerk, Mayar, dan Polar harus menunjuk ke domain production
- Supabase harus benar-benar schema production sesuai [docs/migration.sql](/Users/dellasmarasut/Documents/WEB APP SaaS/FOLIA/docs/migration.sql:1)

## 9. Final Go / No-Go

Status `GO` jika semua poin berikut terpenuhi:

- [ ] Build lulus
- [ ] Typecheck lulus
- [ ] Env production lengkap dan benar
- [ ] Provider dashboard sudah diverifikasi
- [ ] Deploy production sukses
- [ ] DNS dan HTTPS normal
- [ ] Smoke test production lulus

Status `NO-GO` jika salah satu poin berikut masih ada:

- [ ] Masih ada env test key di production
- [ ] App URL salah atau masih berformat development
- [ ] Webhook provider belum diarahkan ke production
- [ ] Schema database production belum sesuai
- [ ] Payment flow belum terverifikasi end-to-end
