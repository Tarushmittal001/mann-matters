# Emoraa — agent instructions

Next.js 14 (App Router) booking site for online therapy, counselling and psychiatry (medication consultations),
for students, professionals and anyone who needs support, usable from anywhere.
**Full map of the codebase: [CODEBASE_CONTEXT.md](CODEBASE_CONTEXT.md). Read its "Session
Bootstrap" section first**, then only the sections your change touches (see its
"Change Impact Map"). Keep that file updated when architecture, schema, API or rules change.
Product truth (users, positioning, real vs placeholder evidence) is in [PRODUCT.md](PRODUCT.md);
read it before any design or copy work.

## Hard rules (never break these)

- **Crisis routing stays reachable from every page.** Tele-MANAS `14416` / emergency `112`
  via `SafetyNotice`, `ChatAssistant` and `/crisis`. Never remove, hide or bury it. This is
  not a crisis service and copy must never imply it is.
- **One source of truth for slot availability:** the UNIQUE `Booking.slotKey`
  (`expertId|date|time`). Releasing a slot = `slotKey = null`. Never add a second store.
- **All booking policy lives in `lib/features/booking/policy.ts`** (IST math, 24-hour change
  window, refunds, hold TTL, max reschedules). Client and server both import it. Don't
  duplicate policy anywhere else.
- **Dates are IST.** Use `todayIST()` / `sessionStart()` from the booking policy, not
  `utils.todayISO()` (server-local time). Dates are `YYYY-MM-DD`, times `HH:mm`.
- **Never store or log card PAN/CVV.** Only brand + last4. Payments are simulated in
  `lib/payments.ts`; keep `charge()`'s signature so a real gateway can drop in.
- **Server is the security boundary.** Every API route validates input, checks auth, and
  checks that the user owns the resource (a user must never read or change another user's
  booking, payment or profile). Hiding a button in the UI is not authorization.
- **Mental-health data is sensitive.** Don't log personal data, session notes or contact
  details, and don't send them to Sentry or PostHog.
- **Login/reset errors stay generic** ("Invalid email or password"). Never reveal whether an
  account exists.
- **Never commit secrets.** New env vars go in `.env.example` with a comment.

## Workflow

- **Never run `next build` while `next dev` is running.** It corrupts `.next` and causes
  hydration errors. Stop the dev server first.
- Check before saying a task is done: `npm run typecheck` and `npm test` must pass. If you
  touched an API route, auth, or anything that reads user data, also run
  `npm run test:integration` against the running dev server. CI
  (`.github/workflows/ci.yml`) runs all of these on every PR.
- Never edit a test just to make it pass. If a test fails, fix the code, or stop and report it.
- New API routes that read or change user data get a case in
  `tests/integration/access-control.test.ts` (owner can, other user gets 404).
- Database is Postgres on Neon. **Every schema change is a migration**: edit `schema.prisma`,
  then `npm run db:migrate -- --name <what>`, and keep the new `prisma/migrations/` folder.
  Never `prisma db push`, never edit an applied migration. CI fails if they drift. Note any
  schema change in CODEBASE_CONTEXT.md's Database section.
- Rate limits go through `rateLimit()` in `lib/rate-limit.ts` (async, shared via Postgres).
  Always `await` it.
- Ask before adding a dependency. Reuse existing utilities (`lib/http.ts`, `lib/auth.ts`,
  `lib/rate-limit.ts`, `formatINR()`) and the shared CSS classes in `app/globals.css`
  (`.wrap`, `.page-top`, `.eyebrow`, `.h-display`, `.prose-mm`, ...).
- Every animation must respect `prefers-reduced-motion` (already wired via `MotionConfig`).
- Keep changes small and focused; don't touch unrelated files.

## Known placeholders (don't present as real)

- The 4 bookable therapists (including the psychiatrist) are invented placeholders and must
  be replaced with real, verified practitioners before launch.
- Payments are simulated. The newsletter signup was removed and will be rebuilt with
  email verification.

## Before launch (open risks, see CODEBASE_CONTEXT.md → Known Technical Debt)

Real payment gateway driven by verified webhooks · end-to-end tests
(Playwright) for signup, booking, payment · full security review.
