# Mann Matters

A premium marketing + booking website for **Mann Matters**, a mental-health and
wellness platform for Indian youth, students, and working professionals. Serene,
luxurious, and calm — built to feel like a boutique-studio commission, not a template.

Therapy and counselling, online, in your language, from ₹599.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (custom brand tokens)
- **Framer Motion** — page transitions, scroll reveals, count-ups, micro-interactions
- **React Three Fiber + drei** — the hero's 3D glass orb (code-split, `ssr: false`, with a static gradient fallback)
- **Lenis** — smooth scrolling (auto-disabled under `prefers-reduced-motion`)
- **next/font** — Fraunces (display serif), Plus Jakarta Sans (body), Tiro Devanagari Hindi (मन accents)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Node 18.18+ is required (developed on Node 24).

## Project structure

```
app/
  layout.tsx            # fonts, metadata, global chrome (nav/footer/WhatsApp)
  template.tsx          # per-route fade/slide transition
  page.tsx              # Home
  services/             # Services
  book/                 # Booking flow
  blog/ , blog/[slug]/  # Blog index + articles (SSG)
  about/ , contact/     # About, Contact
  dashboard/            # Client's own sessions
  admin/                # Ops view of every client and booking
  expert/               # Expert portal (see below)
  api/expert/           # Portal mutations: sessions, availability, time off, profile, notifications
  sitemap.ts, robots.ts, icon.svg, not-found.tsx
components/
  layout/    # Navbar, Footer, WhatsAppButton, Providers (Lenis + MotionConfig)
  expert/    # Portal shell, controls, editors, toasts
  sections/  # Home + page sections (Hero, TrustStrip, HowItWorks, …)
  booking/   # BookingFlow (4-step client state machine)
  three/     # NeuralBrain (animated hero neural-constellation canvas)
  ui/        # Button, Reveal, CountUp, SectionHeading, Accordion, FloatingOrbs
lib/         # site, services, experts, posts, testimonials, faqs, utils
             # auth, db, email, verification
             # clinic-time (IST wall-clock helpers), expert-portal (domain rules),
             # expert-data (server-side loaders + client redaction)
```

## Expert portal

`/expert` is the practitioner's back office. Role `EXPERT` (and `ADMIN`, so ops can
support) gets in; `middleware.ts` bounces everyone else to `/dashboard`.

```
/expert                 Today: live session, the day, alerts, next 14 days
/expert/sessions        The whole book — table on desktop, cards below `lg`, GET-form filters
/expert/sessions/[id]   Meeting room, status, notes, client-safe client panel
/expert/availability    Next 7 days at a glance, weekly hours, time off
/expert/profile         Public listing preview, ops-owned facts, editable profile
/expert/notifications   What reaches you, and how
```

Four rules the code holds to, all worth knowing before changing it:

- **One clock.** Sessions are stored as an IST wall clock (`date` + `time` strings).
  Every conversion lives in `lib/clinic-time.ts`, and no time is ever rendered
  without its zone.
- **Client data is redacted once, at the source.** `lib/expert-data.ts` is the only
  module that reads a client `User` row, and it returns a `ClientSafeClient` —
  first name, last initial, masked email, session count. Every query is scoped to
  the signed-in practitioner's own `expertId`, so another calendar is a 404.
  `WITHHELD_FROM_EXPERTS` is rendered on screen so the boundary is visible.
- **Notes are gated on policy, not preference.** `ExpertProfile.notesPolicy`
  (`APPROVED` / `PENDING` / `BLOCKED`) is set by clinical governance. Without
  approval there is no textarea at all, and the API returns 403. Submitting a note
  locks it; corrections are appended as dated amendments.
- **Conflicts stop and ask.** Time off that lands on a paid session returns 409 with
  the clashing sessions listed; saving anyway takes a second, deliberate press.
  Availability that abandons a booked session saves, then names what to reschedule —
  a booking someone paid for is never cancelled as a side effect.

Every mutation confirms twice: a toast in a polite live region, and an inline
"saved at" stamp on the form.

### Seeding practitioners

```bash
# .env
EXPERT_PASSWORD="…"   # shared password for the six seeded accounts
SEED_DEMO="1"         # also build a demo calendar for the first practitioner

npx prisma db push
npx prisma db seed
```

Accounts are `<expert-id>@mannmatters.in` — e.g. `ananya-iyer@mannmatters.in`,
who is seeded with notes approved, and `arjun-mehta@mannmatters.in`, who is
seeded pending approval so the policy gate can be seen working.

## Brand tokens

Defined in `tailwind.config.ts`:

| Token         | Hex       | Use                          |
| ------------- | --------- | ---------------------------- |
| `forest`      | `#0E3B33` | anchor green (CTA bands, ink)|
| `ivory`       | `#F7F4EE` | page background              |
| `sage`        | `#A8C3B5` | supporting tone              |
| `gold`        | `#C8A45D` | single accent — used sparingly |

Display type: **Fraunces**. Body: **Plus Jakarta Sans**. Devanagari accent (मन): **Tiro Devanagari Hindi**.

## Accessibility & performance

- Semantic landmarks, labelled controls, visible `:focus-visible` rings, `aria-*` on interactive UI.
- Every animation respects `prefers-reduced-motion` (Framer `MotionConfig reducedMotion="user"`, Lenis disabled, CSS keyframes gated).
- The 3D scene is lazy-loaded and skipped on low-memory devices and reduced-motion, falling back to a pure-CSS gradient orb. Home first-load JS stays ~154 kB (Three.js loads only when the canvas mounts).

## Where to wire real APIs later

Everything below is stubbed with realistic client-side behaviour; the payloads already match what a backend would expect.

1. **Booking submit** — `components/booking/BookingFlow.tsx`, the `submitBooking()` function. Replace the simulated delay with a `POST /api/bookings`; it already receives `{ concern, expertId, date, time }`. Slot availability is generated locally in `buildDays()` / `slotTaken()` — swap for a fetch of the therapist's real calendar.
2. **Contact form** — `components/sections/ContactForm.tsx`, the `onSubmit` handler. Point it at `POST /api/contact` (or a form service); fields are named `name`, `email`, `message`.
3. **Newsletter** — `components/layout/Footer.tsx`, the `onSubscribe` handler. Wire to your email provider.
4. **Blog CMS** — content lives in `lib/posts.ts` (typed `Post[]`). To move to a CMS, keep the `Post` type and replace the static array + `getPost()` with CMS fetches; `generateStaticParams` and `generateMetadata` already consume them.
5. **Experts & services** — `lib/experts.ts` and `lib/services.ts` are plain typed data, ready to be served from an API.

## Deploying to Vercel

Push to a Git repo and import into Vercel — zero config. Remote Unsplash images are
already allow-listed in `next.config.mjs`. Set `site.url` in `lib/site.ts` to your
production domain so canonical URLs, the sitemap, and OpenGraph tags resolve correctly.

---

**Note:** Mann Matters is a scheduled-therapy product, not a crisis service. Every page
surfaces the **Tele-MANAS 14416** helpline (free, confidential, 24×7) for anyone in crisis.
