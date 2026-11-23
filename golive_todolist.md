# Curio — Go-Live Todo List

Pre-launch checklist based on the codebase & compliance review.

---

## 1. Swich Live Onboarding & Payment Security
- [ ] Complete Swich live merchant onboarding and obtain live `SWICH_BASE_URL`, `SWICH_CLIENT_ID`, and `SWICH_SECRET_KEY`.
- [ ] **Fix Swich callback checksum bypass** (`apps/web/src/app/api/payment/swich/callback/route.ts`): require valid `checksum`, `transactionId`, and `amount` before running the fallback DB update (or rely strictly on the signed webhook).
- [ ] **Lock down Swich initiate route** (`apps/web/src/app/api/payment/swich/initiate/route.ts`): verify `tx.buyer_id === user.id` before generating a payment URL.
- [ ] **Pass real buyer phone number** (`apps/web/src/app/chat/[id]/page.tsx`): replace hardcoded `msisdn: '03000000000'` with the buyer's actual phone number.

## 2. Security & Auth
- [ ] **Fix `getWalletBalance` IDOR** (`apps/web/src/app/actions/wallet.ts`): verify `auth.getUser()` and check `user.id === userId` before returning wallet balance/transactions.
- [ ] **Lock down `/api/push/send`** (`apps/web/src/app/api/push/send/route.ts`): fail closed (`401`) when `INTERNAL_API_SECRET` is unset, or authenticate callers via Supabase session.
- [ ] **Harden transaction state transitions** (`apps/web/src/app/actions/transaction.ts`):
  - Validate `amount > 0` in `createTransaction`.
  - Require `isBuyer` when transitioning to `completed`.
  - Trigger `creditSellerEarning` server-side inside `updateTransactionStatusSecure` when status becomes `received` (instead of from the browser in `chat/[id]/page.tsx`).
- [ ] **Verify Supabase RLS policies**: ensure users cannot directly update their own `is_admin` or `verification_status` columns on the `user` table, and export RLS policies into `supabase/migrations/`.

## 3. Compliance & Content
- [ ] Remove/deactivate all dummy listings once real listings are uploaded.
- [ ] **Remove dummy fallback in `LiveSignupsTicker`** (`apps/web/src/components/LiveSignupsTicker.tsx`): return `null` when no real recent signups exist.
- [ ] Review CNIC verification flow (`apps/web/src/app/api/verify-cnic/route.ts`): decide if format-only CNIC verification is sufficient for compliance or if manual admin approval (`pending` → `verified`) is required.

## 4. Railway Production Environment Variables
- [ ] `NEXT_PUBLIC_APP_URL=https://curiopk.com`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SWICH_BASE_URL` (live URL, not sandbox)
- [ ] `SWICH_CLIENT_ID`
- [ ] `SWICH_SECRET_KEY`
- [ ] `CRON_SECRET`
- [ ] `INTERNAL_API_SECRET`
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`

## 5. Completed Pre-Launch Fixes
- [x] Fix localhost:8080 redirect in `auth/callback` and `swich/callback` using `x-forwarded-host`.
- [x] Remove crashing `tesseract.js` dependency and fix CNIC verification flow.
- [x] Delete unused `apps/api` SQLite prototype and clean lockfile.
- [x] Fix `#` Terms/Privacy links on Login & Signup pages.
- [x] Update metadata domain (`curiopk.com`) and footer copyright year (`2026`).
- [x] Fix `is_read` column name in `/api/cron/auto-complete`.
- [x] Add `robots.ts` and dynamic `sitemap.ts`.

## 6. Post-Launch Improvements
- [ ] Migrate listing image uploads from base64 strings in Postgres to Supabase Storage (`apps/web/src/app/sell/page.tsx`).
- [ ] Add Sentry error tracking and PostHog analytics.
- [ ] Clean up default Next.js starter SVGs in `apps/web/public/` (`vercel.svg`, `next.svg`, etc.).
