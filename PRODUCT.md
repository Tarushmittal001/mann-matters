# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Young people in India and early-career professionals, served as one audience with no priority between them: students and young adults (often first time in therapy, price-sensitive, sometimes keeping it private from family) and working professionals in their twenties and early thirties (time-poor, paying for themselves). They come to Emoraa to find out whether therapy is for them, try something free, and book an online session with a therapist who speaks their language.

Secondary audiences, confirmed in the product: couples and families (couples, family, parent-coaching and teen formats), and institutions buying programmes for their people (`/for-organisations`: play schools, schools, colleges, companies).

Operational users: experts (`/expert` portal: availability, sessions, notifications, profile, blog posts) and admins (`/admin`: clients, bookings, experts, feedback, posts, settings).

## Product Purpose

Emoraa offers online therapy and counselling for India, in the client's language, from ₹999 (₹599 for students). It is a marketing site, a self-serve booking product (sign up, choose a concern and an expert, hold a live slot, pay, then manage, move or cancel the session), a set of free anonymous self-help tools, an editorial blog, and the Manu assistant.

Success means a person moves from unsure to booked and feels safe doing it. A person in crisis should always reach the right helpline straight away.

## Positioning

Four things together, all true today:

- **Your language.** Sessions are offered in Indian regional languages, not only English and Hindi.
  The list and the count come from `lib/languages.ts`, derived from the practitioner roster — never
  typed into a page, and nothing is offered that no practitioner speaks.
- **Affordable.** Individual therapy from ₹999; student sessions from ₹599. Copy names both, or names
  the ₹999 — a bare "from ₹599" is the student rate and misleads everyone else (`lib/price-claims.ts`).
  Launch pricing runs to 31 Dec 2026 (launch pricing runs to 31 Dec 2026, then standard prices from `lib/pricing.ts`).
- **Unclinical.** A calm, private experience, unlike a medical portal or a typical health app.
- **Free tools first.** People can start with free tools (breathing, check-in, matching, grounding, journal, sounds, affirmations) and Manu before they pay anything. Breathing, grounding and relaxation need no account; the other tools need a free one; Manu on WhatsApp does not.

## Operating Context

- Online only. Run from Noida, with sessions anywhere in India. All dates and times are IST.
- **The blog is written in the portals.** Practitioners draft and submit posts; an admin reads
  each one before it goes live. Admins publish their own directly. Nothing reaches `/blog`
  without a second person having seen it, because these go out under a named clinician.
- Booking flow: sign-in comes first, then concern, expert, live slot, review, a hold of about 15 minutes, payment, and confirmation. Changes are allowed up to 24 hours before a session, and the number of reschedules is limited. All of this policy lives in `lib/features/booking/policy.ts`.
- Sign-in by email and password, or by a verified Indian mobile number and one-time code.
- Confirmed sessions can be added to a calendar as a private `.ics` file that never includes the client's concern.
- **Most free tools need an account; the calming ones do not.** They cost nothing and always
  will. Breathing (`/breathe`), grounding (`/tools/grounding`) and muscle relaxation
  (`/tools/relax`) open with no account (since 19 Oct 2026), because they are what a distressed
  person comes for and a signup form is no thing to put in front of them. The rest are behind
  sign-in: the other `/tools/*`, `/check-in`, `/match`. The `/tools` menu stays open so people
  can see what is on offer first, and `/crisis` is never gated. The tools still run fully in the
  browser once open, and the journal still stays in `localStorage` — requiring an account to
  open a tool does not mean storing what someone writes in it.
- Contact by email (connect@emoraa.com), phone and WhatsApp.

## Capabilities and Constraints

- **Not a crisis service, and copy must never suggest it is.** Crisis routing to Tele-MANAS `14416` and emergency `112` must be reachable from every page (`SafetyNotice`, `ChatAssistant`, `/crisis`), and never hidden or buried. Manu catches crisis terms before any AI call.
- Mental-health data is sensitive. Concerns are never put in browser storage or in calendar files, and personal data is never logged or sent to analytics.
- Login and reset errors stay generic, so they never reveal whether an account exists.
- Payments are simulated until a real gateway is added. Only the card brand and last four digits are ever kept.
- Site copy says practitioners are **certified** — a postgraduate qualification Emoraa has checked —
  from the single constant `site.practitionerWord`, so
  strengthening the claim later is one edit. A unit test (`tests/unit/copy-claims.test.ts`) fails if a
  second descriptor ("licensed", "verified", "certified") appears anywhere in the copy. That is a launch commitment: every practitioner bookable at launch must hold a verified postgraduate qualification (M.A./M.Sc. or higher; Ph.D. counsellors included), checked by us. **No council registration is required of the group, and copy must never claim one**, nor say
  "licensed", which in India is read as that claim. A practitioner who IS on a register shows it on
  their own profile (`registrationBody` + `registrationNo`, e.g. “RCI registered”) — true of that
  person, never asserted of everyone. Psychiatrists must hold a medical-council registration, because they prescribe. Until the placeholders are replaced, the promise is not yet met.
- Prices are in INR. A struck-through price must be a real standard price that will be charged after the launch offer ends, never an invented "was" price.
- Bilingual interface: English and Hindi (`lib/i18n`), with Devanagari used throughout.
- Undecided: the newsletter was removed and will be rebuilt with email verification. The real payment gateway is not yet chosen.

## Brand Commitments

- Name: **Emoraa** (renamed from "mann Matters"). Domain `emoraa.com`. Tagline: "Your emotions matter." Booking references start with `EM-`.
- Assets: `public/brand/` (icon, logo, lockup, wordmark). **`emoraa-lockup.png` is stale and
  unused:** it has the old tagline baked into its pixels. The footer now renders the wordmark
  plus the tagline as live text from `site.tagline`, so the tagline can never drift from the
  image again. Regenerate or delete the lockup before launch.
- Voice, taken from the existing copy: warm, plain, honest and specific to India. Copy explains the real reason for a rule rather than reassuring vaguely, and does not use hype or pressure.
- **Reading standard — plain English, not simple-minded.** The audience runs from someone with
  basic English to a fluent reader, and the same sentence has to work for both.
  - One idea per sentence. Break anything past about 20 words.
  - Everyday words: *use*, not *utilise*; *about*, not *regarding*; *help*, not *facilitate*.
  - Say the thing. No metaphor the reader has to decode, no joke that carries the meaning, no
    clause stacked inside another clause.
  - **Not baby talk.** Full adult sentences, just plain ones. Short does not mean blunt, and
    plain does not mean cold — the warmth comes from what is said, not from cleverness.
  - A short, well-known phrase is not the problem. "4 a.m. dost" is three easy words; a
    thirty-word sentence explaining a refund rule is the problem. Target difficulty, not charm.
- The team set the experience bar as "a boutique-studio commission, not a template".

## Evidence on Hand

- **Real:** the founding team, with photos in `public/team/` (Bhavya Nimesh, Gaurav Mittal, Ishaan Mittal, Tarush Mittal).
- **Real:** some approved client feedback. Testimonials only ever come from feedback a client submitted and an admin approved (`lib/feedback.ts`). There are no hand-written sample stories, and none may be added.
- **Placeholders, not evidence:** the 4 bookable therapists (including the psychiatrist) are invented and must be replaced with real, verified practitioners before launch. Never present them as real. The portraits named in `public/reviews/README.md` are illustration specs, not real clients.
- **Absent, never fabricate:** named partner organisations, client counts, outcome statistics, ratings, press coverage and certifications beyond what a real practitioner holds.
- Real external facts: the helpline list in `lib/site.ts` (Tele-MANAS, 112, KIRAN, Vandrevala, iCall).

## Product Principles

1. **Safety before conversion.** The way to crisis help stays visible and direct. No design choice may push a distressed person toward a sales funnel.
2. **Honesty over persuasion.** Only show real people, real prices and real feedback. Placeholders are labelled, never dressed up as evidence.
3. **Let people start for free.** Free tools and Manu are a real way in, not a lead trap. The
   tools ask for an account but never for money, and Manu needs neither. Asking for payment
   comes after trust. **The sign-in wall must always carry a route to crisis help**, because it
   now stands between a distressed person and the grounding exercise they came for.
4. **Privacy you can feel.** Collect the least needed, say what is held and why, and never let health details leak into storage, logs or files.
5. **Speak to them in their language and their circumstances.** Use Indian context, prices and languages, and recognise that therapy may be a first step taken privately.

## Accessibility & Inclusion

- Every animation honours `prefers-reduced-motion` (wired through `MotionConfig`, and Lenis turns off).
- Bilingual English/Hindi interface, with Devanagari typeset properly.
- Budget-friendly by design: mobile-first users, sometimes on slow connections. The 3D hero has a static fallback.
- Inclusive services, including an LGBTQIA+ affirmative format.
