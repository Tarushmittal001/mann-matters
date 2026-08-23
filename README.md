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
  sitemap.ts, robots.ts, icon.svg, not-found.tsx
components/
  layout/    # Navbar, Footer, WhatsAppButton, Providers (Lenis + MotionConfig)
  sections/  # Home + page sections (Hero, TrustStrip, HowItWorks, …)
  booking/   # BookingFlow (4-step client state machine)
  three/     # NeuralBrain (animated hero neural-constellation canvas)
  ui/        # Button, Reveal, CountUp, SectionHeading, Accordion, FloatingOrbs
lib/         # site, services, experts, posts, testimonials, faqs, utils
```

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
