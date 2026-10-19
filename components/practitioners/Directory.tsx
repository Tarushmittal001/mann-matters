"use client";

import { forwardRef, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatINR } from "@/lib/utils";
import type { PractitionerCard } from "@/lib/practitioners";

/**
 * The people you would actually be talking to.
 *
 * ── THE DESIGN PROBLEM ──────────────────────────────────────────────────────
 * A grid of faces with star ratings turns choosing a therapist into shopping,
 * and the person choosing is usually anxious and already afraid of picking
 * wrong. So this narrows rather than impresses: two filters in plain words,
 * and cards that answer what people actually ask — can they help with *my*
 * thing, can we speak *my* language, what will it cost, are they free.
 *
 * ── WHERE THE COLOUR COMES FROM ─────────────────────────────────────────────
 * One hue per person, spread evenly around the wheel. The brain-region palette
 * the service cards use holds eight colours and this team is eleven, so
 * borrowing from it put two faces side by side in the same tint — which reads
 * as a grouping that does not exist.
 *
 * Saturation and lightness are pinned here, not per card: every hue lands at
 * the same muted weight, which is what stops eleven colours turning a page
 * about mental health into a paint chart. Change these two numbers and the
 * whole grid moves together.
 *
 * Colour never carries meaning on its own: every accent is paired with a word.
 * And it never touches body text, because these mid-tone hues do not hold
 * contrast on ivory — it lives in rules, rings, tints and chips instead.
 *
 * ── WHY THE CARDS ARE NOT BUILT ON BIOGRAPHIES ──────────────────────────────
 * Seven of eleven listings have no bio. A card designed around prose would
 * show four good profiles and seven holes, on the page whose only job is to
 * earn trust. So the card runs on what is always there, and a bio — where it
 * exists — is a quiet extra line.
 *
 * ── THE RATING IS ABSENT ────────────────────────────────────────────────────
 * Ranking therapists like restaurants invites a judgement nobody browsing is
 * equipped to make, and 4.8 beside 4.9 means nothing real.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/* The register every practitioner hue is rendered at — chosen to sit inside
   the range the brain-region palette already occupies (S 25–50%, L 36–59%). */
const S = 38;
const L = 47;
const accent = (h: number, alpha = 1) =>
  alpha === 1 ? `hsl(${h} ${S}% ${L}%)` : `hsl(${h} ${S}% ${L}% / ${alpha})`;

function Pill({
  on,
  children,
  onClick,
}: {
  on: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "press whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[0.85rem] font-medium transition-all duration-300",
        on
          ? "border-forest-800 bg-forest-800 text-ivory shadow-lift"
          : "border-forest-800/18 text-forest-800 hover:border-forest-800/45 hover:bg-forest-800/[0.03]"
      )}
    >
      {children}
    </button>
  );
}

/**
 * forwardRef, because AnimatePresence has to hold a ref to its direct child.
 *
 * Without it React warns "Function components cannot be given refs" and the
 * exit animation silently does nothing — `popLayout` needs the node to measure
 * and park it while the rest of the grid closes up. The warning was the only
 * sign; filtering still looked roughly right, which is what makes it the kind
 * of bug that ships.
 */
const Card = forwardRef<HTMLElement, { p: PractitionerCard; index: number }>(function Card(
  { p, index },
  ref
) {
  const [open, setOpen] = useState(false);

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: EASE, delay: Math.min(index, 5) * 0.04 }}
      style={{
        ["--accent" as string]: accent(p.accentH),
        ["--tint" as string]: accent(p.accentH, 0.12),
        ["--tint-soft" as string]: accent(p.accentH, 0.055),
        ["--ring" as string]: accent(p.accentH, 0.36),
      }}
      /* No h-full: with the grid set to items-start, a card sizes to its own
         content. Every card is height-locked so they match anyway — but when
         one is expanded it grows alone, instead of dragging its whole row up
         and leaving the voids this page just stopped having. */
      className="card-lift group relative flex flex-col overflow-hidden rounded-[1.4rem] border border-forest-800/10 bg-gradient-to-b from-[color:var(--tint)] via-ivory-light via-40% to-ivory-light shadow-lift"
    >
      {/* the rule fades out rather than stopping dead, so a row of cards reads
          as a spectrum instead of eleven hard stripes */}
      <span
        className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-[color:var(--accent)] via-[color:var(--accent)] to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="flex gap-4 p-5 pt-6 sm:p-6 sm:pt-7">
        <div className="relative shrink-0">
          <div
            className="relative h-[4.6rem] w-[4.6rem] overflow-hidden rounded-[1.1rem] bg-[color:var(--tint)] ring-2 ring-[color:var(--ring)] ring-offset-2 ring-offset-ivory-light"
          >
            {p.photo && (
              <Image
                src={p.photo}
                alt={`Portrait of ${p.name}`}
                fill
                sizes="74px"
                className="object-cover transition-transform duration-700 ease-silk group-hover:scale-[1.07]"
              />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {/* Every line below is height-locked. Cards share a row height, so
              one tall card used to leave a void in the two beside it — most
              visibly where a listing had no bio and its neighbour did. Clamped
              lines mean no card can outgrow another, and the row closes up. */}
          <h3 className="truncate font-display text-xl font-medium leading-tight text-forest-900">
            {p.name}
          </h3>

          <p className="mt-1.5 flex min-h-[1.25rem] flex-wrap items-center gap-x-2 gap-y-1 text-[0.84rem] font-medium text-forest-800">
            <span className="flex items-center gap-1.5">
              {/* the dot is the colour's only job here — the word beside it
                  carries the meaning for anyone who cannot see the hue */}
              <span
                className="inline-block h-[0.4rem] w-[0.4rem] shrink-0 rounded-full bg-[color:var(--accent)]"
                aria-hidden="true"
              />
              {p.discipline}
            </span>
            {/* inline, so the one card that carries it is no taller than the ten that do not */}
            {p.prescribes && (
              <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-gold-dark">
                Can prescribe
              </span>
            )}
          </p>

          <p className="mt-1.5 line-clamp-2 min-h-[2.1rem] text-[0.8rem] leading-snug text-ink/60">
            {p.credentials}
          </p>
          <p className="mt-1 truncate text-[0.8rem] text-ink/60">
            {p.years} {p.years === 1 ? "year" : "years"} · {p.languages.join(", ")}
          </p>
        </div>
      </div>

      {/* One row of chips by default, so no card outgrows its neighbours. The
          rest are a click away rather than hidden for good: "+3" was a dead
          label, and a person reading it had no way to find out what the three
          were short of opening the profile. */}
      <div className="px-5 sm:px-6">
        <div
          className={cn(
            "flex items-center gap-1.5",
            open ? "min-h-[1.75rem] flex-wrap" : "h-[1.75rem] overflow-hidden"
          )}
        >
          {(open ? p.specialties : p.specialties.slice(0, 3)).map((sp) => (
            <span
              key={sp}
              className="shrink-0 truncate rounded-full bg-[color:var(--tint)] px-2.5 py-1 text-xs font-medium text-forest-800"
            >
              {sp}
            </span>
          ))}

          {p.specialties.length > 3 && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={
                open
                  ? `Show fewer things ${p.name} works with`
                  : `Show all ${p.specialties.length} things ${p.name} works with`
              }
              className="press shrink-0 rounded-full border border-forest-800/20 px-2 py-0.5 text-xs font-medium text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
            >
              {open ? "Show less" : `+${p.specialties.length - 3}`}
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <div className="mx-5 mt-5 border-t border-forest-800/10 sm:mx-6" />
        <div className="flex flex-wrap items-end justify-between gap-3 bg-[color:var(--tint-soft)] px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-[0.66rem] uppercase tracking-[0.16em] text-ink/45">Sessions</p>
            <p className="mt-1 font-display text-[1.35rem] font-medium leading-none text-forest-900">
              {p.priceRange
                ? p.priceRange.min === p.priceRange.max
                  ? formatINR(p.priceRange.min)
                  : `${formatINR(p.priceRange.min)}–${formatINR(p.priceRange.max)}`
                : "On request"}
            </p>
            <p className="mt-1.5 text-[0.76rem] text-ink/55">
              {p.offers.length} {p.offers.length === 1 ? "format" : "formats"}
              {!p.bookable && " · not taking bookings"}
            </p>
          </div>

          <Link
            href={`/therapists/${p.slug}`}
            className="press rounded-full border border-forest-800/20 bg-ivory-light/70 px-4 py-2 text-[0.85rem] font-semibold text-forest-800 transition-colors hover:border-forest-800 hover:bg-forest-800 hover:text-ivory"
          >
            Read more
          </Link>
        </div>
      </div>
    </motion.article>
  );
});

export default function Directory({
  people,
  languages,
  concerns,
}: {
  people: PractitionerCard[];
  languages: string[];
  /** The six named concerns, not the free-text tags on the cards. */
  concerns: { id: string; label: string }[];
}) {
  const [language, setLanguage] = useState<string | null>(null);
  const [concern, setConcern] = useState<string | null>(null);
  const [prescribersOnly, setPrescribersOnly] = useState(false);

  const shown = useMemo(
    () =>
      people.filter(
        (p) =>
          (!language || p.languages.includes(language)) &&
          (!concern || p.concerns.includes(concern)) &&
          (!prescribersOnly || p.prescribes)
      ),
    [people, language, concern, prescribersOnly]
  );

  const filtering = !!language || !!concern || prescribersOnly;

  return (
    <>
      <div className="mt-10 space-y-5 rounded-[1.4rem] border border-forest-800/10 bg-ivory-light/60 p-5 sm:p-6">
        <div>
          <p className="mb-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-ink/45">
            In the language you think in
          </p>
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <Pill key={l} on={language === l} onClick={() => setLanguage(language === l ? null : l)}>
                {l}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-ink/45">
            What you&apos;re carrying
          </p>
          <div className="flex flex-wrap gap-2">
            {concerns.map((c) => (
              <Pill
                key={c.id}
                on={concern === c.id}
                onClick={() => setConcern(concern === c.id ? null : c.id)}
              >
                {c.label}
              </Pill>
            ))}
            <Pill on={prescribersOnly} onClick={() => setPrescribersOnly(!prescribersOnly)}>
              Needs medication
            </Pill>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[0.9rem] text-ink/65">
          {shown.length === people.length
            ? `${people.length} practitioners`
            : `${shown.length} of ${people.length}`}
        </p>
        {filtering && (
          <button
            type="button"
            onClick={() => {
              setLanguage(null);
              setConcern(null);
              setPrescribersOnly(false);
            }}
            className="link-draw text-[0.88rem] font-medium text-forest-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-[1.4rem] border border-dashed border-forest-800/20 p-12 text-center">
          <p className="font-display text-xl text-forest-900">Nobody matches all of that.</p>
          <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink/65">
            Loosen one of the filters, or let us look for you — the matcher weighs language and
            concern together rather than demanding both.
          </p>
          <Link
            href="/match"
            className="press mt-6 inline-block rounded-full bg-forest-800 px-6 py-2.5 text-[0.9rem] font-semibold text-ivory transition-colors hover:bg-forest-700"
          >
            Find me a therapist
          </Link>
        </div>
      ) : (
        <motion.div
          layout
          /* items-start, so a card that has been expanded grows on its own
             instead of stretching its whole row — the voids this page just
             stopped having would otherwise come straight back on a click. */
          className="mt-8 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {shown.map((p, i) => (
              <Card key={p.slug} p={p} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
