import { dateWhere, instantWhere, type Range } from "@/lib/admin-period";
import { prisma } from "@/lib/db";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@/lib/features/booking/policy";
import { concerns } from "@/lib/experts";
import { listExperts } from "@/lib/experts-store";

/**
 * The numbers behind /admin/insights.
 *
 * Gathered here rather than in the page so the page stays a layout and these
 * stay testable. Every count is a database aggregate — nothing loads a whole
 * table into memory to count it, which the Overview page still does and which
 * stops being free the moment this practice has a few hundred clients.
 *
 * ── ON DATES ───────────────────────────────────────────────────────────────
 * The period — preset or custom range — is resolved once in `lib/admin-period`
 * and arrives here as a `Range`. Bookings carry `date` as a `YYYY-MM-DD` in
 * clinic time, so they filter by string comparison (`dateWhere`); clients
 * carry a real `createdAt`, so they filter by instant (`instantWhere`), and
 * those instants are IST midnights. Mixing the two silently would put a client
 * who signed up at 11pm IST in yesterday's bucket.
 *
 * Not everything here respects the range, and the page says which: retention,
 * the free-session conversion and the language panel are all-time by design,
 * because a fortnight cannot tell you whether anybody came back.
 */

export { PRESETS, isPreset, resolveRange } from "@/lib/admin-period";

export type Insights = Awaited<ReturnType<typeof gatherInsights>>;

export async function gatherInsights(range: Range) {
  const inPeriodDate = dateWhere(range);
  const inPeriodAt = instantWhere(range);

  const [
    totalClients,
    newClients,
    totalBookings,
    periodBookings,
    byConcern,
    byStatus,
    perClient,
    freeBookers,
    languageRows,
    placeRows,
    experts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", ...(inPeriodAt ? { createdAt: inPeriodAt } : {}) } }),
    prisma.booking.count(),
    prisma.booking.count({ where: inPeriodDate ? { date: inPeriodDate } : {} }),

    // what people come for, most first
    prisma.booking.groupBy({
      by: ["concern"],
      _count: { _all: true },
      where: inPeriodDate ? { date: inPeriodDate } : {},
    }),

    // cancellations and no-shows, as a share of everything booked
    prisma.booking.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: inPeriodDate ? { date: inPeriodDate } : {},
    }),

    /* Sessions per client — the shape of retention. Counted over bookings that
       actually happened or are going to: a cancelled booking is not a session
       somebody attended, and counting it would flatter the number. */
    prisma.booking.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: {
        status: { in: [BOOKING_STATUS.confirmed, BOOKING_STATUS.completed] },
      },
    }),

    // everyone who took the free first session, and whether they came back paying
    prisma.booking.findMany({
      where: { proBono: true },
      select: { userId: true },
    }),

    prisma.user.groupBy({
      by: ["language"],
      _count: { _all: true },
      where: { role: "USER" },
    }),

    /* Where the clients who actually booked in this period are. Grouped by
       state *and* city in one pass, because the two breakdowns below are two
       readings of the same rows — asking twice would let them disagree.

       Scoped by booking rather than by signup date, because the question this
       answers is "which parts of India are taking sessions", not "who joined
       recently". A client who signed up last year and booked this week is in
       this period; one who signed up this week and has not booked is not. */
    prisma.user.groupBy({
      by: ["state", "city"],
      _count: { _all: true },
      where: {
        role: "USER",
        bookings: { some: inPeriodDate ? { date: inPeriodDate } : {} },
      },
    }),

    listExperts(),
  ]);

  // ── what people come for ────────────────────────────────────────────────
  const concernLabel = (id: string) => concerns.find((c) => c.id === id)?.label ?? id;
  const demand = byConcern
    .map((r) => ({ id: r.concern, label: concernLabel(r.concern), count: r._count._all }))
    .sort((a, b) => b.count - a.count);

  // ── how a booking ends ──────────────────────────────────────────────────
  const statusCount = (s: string) => byStatus.find((r) => r.status === s)?._count._all ?? 0;
  const cancelled = statusCount(BOOKING_STATUS.cancelled);
  const noShow = statusCount(BOOKING_STATUS.noShow);
  const decided = byStatus.reduce((n, r) => n + r._count._all, 0);

  // ── retention ───────────────────────────────────────────────────────────
  const buckets = { once: 0, few: 0, many: 0 };
  let sessions = 0;
  for (const r of perClient) {
    const n = r._count._all;
    sessions += n;
    if (n === 1) buckets.once++;
    else if (n <= 4) buckets.few++;
    else buckets.many++;
  }
  const returning = buckets.few + buckets.many;

  // ── the free session, and whether it leads anywhere ─────────────────────
  const freeIds = Array.from(new Set(freeBookers.map((b) => b.userId)));
  const convertedIds = freeIds.length
    ? await prisma.booking.findMany({
        where: {
          userId: { in: freeIds },
          proBono: false,
          payment: { status: { in: [PAYMENT_STATUS.paid, PAYMENT_STATUS.refunded] } },
        },
        select: { userId: true },
        distinct: ["userId"],
      })
    : [];

  /* ── language ───────────────────────────────────────────────────────────
     Demand is read from the language a client set on their own profile. It is
     the only honest signal: which therapist somebody booked says more about
     who had a free slot than about the language they wanted. The field is
     optional and rarely filled, so "unknown" is reported rather than hidden —
     a page that quietly dropped it would imply demand data exists when it
     does not. */
  const coverage = new Map<string, number>();
  for (const e of experts) for (const l of e.languages) coverage.set(l, (coverage.get(l) ?? 0) + 1);

  const askedFor = languageRows
    .filter((r) => r.language)
    .map((r) => ({ language: r.language as string, clients: r._count._all }));
  const unknownLanguage = languageRows.find((r) => !r.language)?._count._all ?? 0;

  const languages = Array.from(
    new Set([...askedFor.map((a) => a.language), ...Array.from(coverage.keys())])
  )
    .map((language) => ({
      language,
      clients: askedFor.find((a) => a.language === language)?.clients ?? 0,
      therapists: coverage.get(language) ?? 0,
    }))
    .sort((a, b) => b.clients - a.clients || b.therapists - a.therapists);

  /* ── where they are ─────────────────────────────────────────────────────
     Two lists off the one grouping. Cities are labelled with their state,
     because there is a Hyderabad in Telangana and a Hyderabad in Sindh, and
     closer to home an admin reading "Aurangabad" deserves to know which one.
     Rows with no state are counted separately rather than folded into a
     bucket: every account that pre-dates this field has none, and quietly
     showing them as a region would invent one. */
  const byState = new Map<string, number>();
  const cityRows: { city: string; state: string; clients: number }[] = [];
  let unknownPlace = 0;

  for (const r of placeRows) {
    const n = r._count._all;
    if (!r.state) {
      unknownPlace += n;
      continue;
    }
    byState.set(r.state, (byState.get(r.state) ?? 0) + n);
    if (r.city) cityRows.push({ city: r.city, state: r.state, clients: n });
  }

  const states = Array.from(byState, ([state, clients]) => ({ state, clients })).sort(
    (a, b) => b.clients - a.clients || a.state.localeCompare(b.state)
  );
  const cities = cityRows.sort((a, b) => b.clients - a.clients || a.city.localeCompare(b.city));
  const placed = states.reduce((n, s) => n + s.clients, 0);

  return {
    range,
    clients: { total: totalClients, new: newClients },
    bookings: { total: totalBookings, inPeriod: periodBookings },
    demand,
    outcomes: { cancelled, noShow, decided },
    retention: {
      ...buckets,
      clientsWithSessions: perClient.length,
      returning,
      averagePerClient: perClient.length ? sessions / perClient.length : 0,
    },
    freeSession: { took: freeIds.length, converted: convertedIds.length },
    languages,
    unknownLanguage,
    where: { states, cities, placed, unknown: unknownPlace },
  };
}
