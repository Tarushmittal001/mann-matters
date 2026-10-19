# Changelog

A record of what changed in Emoraa. Most commit messages here are names ("Tarush-4"), so the
entries below were worked out from the changes themselves. Dates are commit dates.

## Unreleased: 21 Sep to 6 Oct 2026 (not yet committed)

### Postgres and shared rate limits (8 Oct)
- **Database moved from SQLite to PostgreSQL on Neon.** New `DIRECT_URL` and `APP_ENV` env vars.
  Fresh start: the new database gets the schema and the seed; the old `prisma/dev.db` is kept
  on disk as a backup but no longer used.
- **Real migrations:** `prisma/migrations/…_init` is the baseline. New scripts `db:migrate`,
  `db:deploy`, `db:seed`. CI now runs on a Postgres container, applies the migrations, and fails
  if the schema and migrations drift apart.
- **Rate limits are shared** across server instances and survive deploys (new `RateLimit` table).
  Client identifiers are stored only as an HMAC, never as a raw IP. If the database is down the
  limiter allows the request and logs it, rather than locking everyone out.
- New integration test for rate limiting (6 checks). Test tooling now requires
  `APP_ENV=development` or `ci`, so it can't run against production.

### Tests and CI (8 Oct)
- **Vitest** added (dev dependency). New scripts: `npm run typecheck`, `npm test`,
  `npm run test:integration`.
- Unit tests for the booking policy (`tests/unit/`): IST dates, slot validation, cancel and
  reschedule rules, refunds, free-session return.
- Integration test for access control (`tests/integration/`): 40 checks that no client can reach
  another client's data and no practitioner can reach another practitioner's clients. All pass.
- **GitHub Actions CI** (`.github/workflows/ci.yml`): typecheck, unit tests, build, then the
  integration tests against the built app, on every pull request and push to `main`.
- `CLAUDE.md` added: the hard rules every AI coding session loads automatically.

### Launch-readiness pass (6 Oct)
- **Legal pages:** `/privacy`, `/terms`, `/refund-policy`, `/cookies`. These are drafts.
  Gold-highlighted `<Fill>` gaps (company name, address, Grievance Officer, hosting region,
  retention periods) need filling and a lawyer's review.
- **Cookie consent banner.** PostHog analytics only loads after the visitor accepts.
  "Cookie settings" in the footer reopens the banner.
- **Signup consent:** a required Terms/Privacy checkbox, also checked on the server. New
  `User.termsAcceptedAt` column.
- **Canonical fix:** about 20 public pages inherited `canonical: "/"` from the root layout, which
  told Google they were copies of the homepage. Each page now points to itself.
- **Removed fake reviews:** the 6 invented testimonials are gone. The homepage shows approved
  client feedback only, and hides the section when there is none.
- **Removed unprovable stats** (100+ sessions, 5+ psychologists, 4.9/5 rating). Only
  "2+ languages" remains.
- Default social share image (`app/opengraph-image.png`, `app/twitter-image.png`).
- Team and sound images converted from PNG to WebP (about 2 MB each down to 27–321 KB).
- Text contrast raised to WCAG AA: faint `text-ink/40–60` changed to `/70` (394 changes across
  103 files).
- Footer: Legal column added. Placeholder social links and the non-working newsletter form
  removed.
- Manu's model updated from the retired `claude-3-5-haiku-latest` to `claude-haiku-4-5`.
  Duplicate `ADMIN_PASSWORD` removed from `.env.example`.

### New features
- **Hindi version** at `/hi`: home, services, book, crisis, login and signup. Language toggle,
  and `lang="hi"` on those pages.
- **Installable app (PWA):** manifest, app icons, install prompt, service worker, and an offline
  page that leads with crisis numbers.
- **Coupons:** admins create discount codes, and clients apply them at booking.
- **Referrals:** ₹300 off for the friend, and ₹300 credit for the referrer once the friend
  attends.
- **Revenue and payouts** page for admins.
- **Admin audit log** of every admin action.
- **Receipts:** numbered and printable at `/receipt/[id]`.
- **Intake form:** filled in by the client before the first session, read by the therapist.
- **Homework:** set by the therapist between sessions, shown on the client dashboard.
- **Guardian consent** for clients under 18.
- **Free first session**, tied to a verified phone number.
- **Burnout check** tool (`/tools/burnout`).
- Admins can give therapists logins (email invite, no shared passwords) and upload their photos.
- `StaffBar` header for the admin and expert portals.
- Fixed list of suggested languages and specialities on the therapist form.
- Scripts: `scripts/add-admin.mjs`, `scripts/test-logins.mjs`.

### Removed
- Sleep wind-down tool (`/tools/sleep`).

## 21 Sep 2026: "Tarush-4"
- **Admin therapist management** (Expert Manager): add, edit and hide listings.
- **Client feedback:** clients submit it, admins approve or hide it, and approved feedback
  appears as homepage stories with illustrated avatars.
- **Forgot and reset password** flow.
- **Verified contact form:** the visitor's email or phone is confirmed with a code before
  sending.
- **Pricing with launch offer:** strike-through prices that end on a set date.
- New brand assets: logo, lockup, wordmark, icon.
- "Lite motion" mode for slower devices.
- Removed `/therapy/[slug]` pages (replaced by `/services/[slug]`), and the CulturalIntelligence
  and ToolsSection homepage sections.

## 14 Sep 2026: "tarush4"
- Added: homepage talk bar, a self-check questionnaire on service pages, a new services grid,
  "The Room" and "Open Handbook" visuals, and a brand colour palette.
- Removed: the old services preview, and the NodeBuilding, Ripples and WayThrough visuals.

## 4 Sep 2026
- **mobile-otp-login:** sign in with phone and SMS code (Twilio), plus adding and verifying a
  phone number in your profile.
- **seo-sentry-bug-fixes:** Manu goes live as an AI assistant with crisis-safety checks. Sentry
  error monitoring. PostHog analytics. "Add to calendar" export. Detail page for each service at
  `/services/[slug]`.
- **bug-fix-minor:** the hero 3D brain now loads after the page (faster). Sentry config and
  navbar fixes.
- **mobile-responsive:** mobile fixes to the navbar, footer, safety notice, WhatsApp button,
  chat assistant and reschedule dialog.
- **ayush-dev:** booking rules moved into `lib/features/booking` (policy and server logic).
- **Tarush 3:** auth, email and booking fixes. Email now tries several providers and reports
  delivery status.

## 3 Sep 2026
- **"bhatt": therapist portal at `/expert`.** Dashboard, sessions list and detail, weekly
  availability, time off, session notes with amendments, session status, meeting-room link
  (Meet, Jitsi or Daily), profile and notification settings, clinic-timezone handling.
  `PublicChrome` hides the public site's navbar, footer and floating buttons inside the portals.
- **"Tarush Comit 1"**
  - **Rebrand** from "mann Matters" to **Emoraa** (about 30 Aug).
  - **Booking system:** live slot picker, 5-step booking flow, cancel and reschedule (24-hour
    rule, maximum 2 reschedules).
  - **Payments** panel with failure states. This is a *simulated* gateway: replace it with
    Razorpay before taking real payments.
  - Client profile page, with profile edit and change-password forms.
  - For institutions: pack builder and segment grid.
  - Page error and loading screens.
  - Shared form building blocks: fields, alerts, empty states, validation.
  - Standard API responses and rate limiting.
  - Decorative visuals (chai steam, India outline, ink lines and others).
  - First version of `CODEBASE_CONTEXT.md`.

## Database tables added (27 Aug to 6 Oct)
PhoneOtp, ExpertProfile, AvailabilityRule, TimeOff, SessionNote, NoteAmendment, Payment, Feedback,
PasswordResetToken, Expert, Coupon, CouponRedemption, IntakeForm, Homework, ReceiptSequence,
AuditEvent.
