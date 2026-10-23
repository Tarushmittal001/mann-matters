import { dateWhere, type Range } from "@/lib/admin-period";
import { prisma } from "@/lib/db";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@/lib/features/booking/policy";
import { serviceBySlug } from "@/lib/service-catalogue";
import {
  HELD,
  PAYABLE,
  bucketsBetween,
  moneyOn,
  monthLabel,
  monthOf,
  paysPractitioner,
  shareFor,
  type Grain,
} from "@/lib/payouts";

/**
 * What one practitioner has earned, and what has actually reached them.
 *
 * ── SCOPED TO THEM, ALWAYS ─────────────────────────────────────────────────
 * Every query here is filtered by `expertId` taken from the session, never
 * from a request. A practitioner has no business seeing another's takings,
 * and the only thing standing between them is this file being careful.
 *
 * ── WHAT THE NUMBERS MEAN ──────────────────────────────────────────────────
 * Their *share* is the number that matters to them, not what the client paid:
 * the platform keeps a percentage, and showing gross would quietly overstate
 * what anybody is owed. So:
 *
 *   earned   — their share of money collected and kept, for sessions held
 *              and for late cancellations whose fee was kept (paysPractitioner)
 *   received — payouts an admin has actually recorded as sent
 *   awaited  — earned minus received: the gap they are still waiting on
 *
 * A refunded session pays nobody, so it drops out of `earned` the moment the
 * refund lands — which is also why `received` can exceed `earned` for a month
 * that was paid out before a refund. The page shows that rather than clamping
 * it to zero, because an overpayment is a real thing that needs settling.
 */

export type EarningsBucket = {
  key: string;
  label: string;
  sessions: number;
  free: number;
  /** What clients paid, net of refunds, for sessions in this bucket. */
  collected: number;
  /** The practitioner's share of that. */
  earned: number;
};

export type Earnings = Awaited<ReturnType<typeof gatherEarnings>>;

export async function gatherEarnings(expertId: string, range: Range, grain: Grain) {
  const share = shareFor(expertId);
  const inRange = dateWhere(range);

  const [rows, payouts, lifetimeRows] = await Promise.all([
    prisma.booking.findMany({
      where: { expertId, ...(inRange ? { date: inRange } : {}) },
      select: {
        date: true,
        status: true,
        amount: true,
        proBono: true,
        payment: { select: { status: true, amount: true, refundAmount: true } },
      },
    }),
    prisma.payout.findMany({ where: { expertId }, orderBy: { month: "desc" } }),
    prisma.booking.findMany({
      where: { expertId, status: { in: PAYABLE } },
      select: {
        status: true,
        payment: { select: { status: true, amount: true, refundAmount: true } },
      },
    }),
  ]);

  /* ── buckets over the range ─────────────────────────────────────────── */
  const earliest = range.from ?? rows.map((r) => r.date).sort()[0] ?? range.to;
  const keys = bucketsBetween(earliest, range.to, grain);
  const bucketOf = (date: string) =>
    grain === "day"
      ? date
      : grain === "month"
        ? date.slice(0, 7)
        : grain === "year"
          ? date.slice(0, 4)
          : keys.find((k) => k <= date) ?? keys[keys.length - 1];

  const byKey = new Map<string, EarningsBucket>(
    keys.map((key) => [
      key,
      { key, label: labelFor(key, grain), sessions: 0, free: 0, collected: 0, earned: 0 },
    ])
  );

  let periodCollected = 0;
  let periodSessions = 0;
  let awaitedFromClients = 0;

  for (const r of rows) {
    const held = HELD.includes(r.status);
    const { collected, refunded } = moneyOn(r.payment);
    const net = collected - refunded;

    /* Money still owed BY the client — a session held with a payment that
       never completed. Shown separately because it is not the practitioner's
       share that is missing, it is the fee itself. */
    if (
      held &&
      !r.proBono &&
      (r.payment?.status === PAYMENT_STATUS.pending || r.payment?.status === PAYMENT_STATUS.failed)
    ) {
      awaitedFromClients += r.amount;
    }

    if (!paysPractitioner(r)) continue;
    periodSessions += 1;
    periodCollected += net;

    const bucket = byKey.get(bucketOf(r.date));
    if (!bucket) continue;
    bucket.sessions += 1;
    if (r.proBono) bucket.free += 1;
    bucket.collected += net;
  }

  byKey.forEach((b) => {
    b.earned = Math.round(b.collected * share);
  });

  /* ── lifetime, and what has actually arrived ────────────────────────── */
  const lifetimeCollected = lifetimeRows.filter(paysPractitioner).reduce((sum, r) => {
    const { collected, refunded } = moneyOn(r.payment);
    return sum + collected - refunded;
  }, 0);
  const lifetimeEarned = Math.round(lifetimeCollected * share);
  const received = payouts.reduce((sum, p) => sum + p.amount, 0);

  return {
    share,
    buckets: Array.from(byKey.values()),
    period: {
      sessions: periodSessions,
      collected: periodCollected,
      earned: Math.round(periodCollected * share),
    },
    lifetime: { collected: lifetimeCollected, earned: lifetimeEarned },
    received,
    /* Never negative on screen: if more has been sent than earned, that is an
       overpayment and belongs in its own line, not hidden as a minus. */
    awaited: Math.max(0, lifetimeEarned - received),
    overpaid: Math.max(0, received - lifetimeEarned),
    awaitedFromClients,
    payouts: payouts.map((p) => ({
      month: p.month,
      monthName: monthLabel(p.month),
      amount: p.amount,
      paidAt: p.paidAt.toISOString(),
      reference: p.reference,
    })),
    /** Months with sessions but no payout row yet, newest first. */
    unpaidMonths: unpaidMonths(rows, payouts.map((p) => p.month)),
  };
}

function unpaidMonths(
  rows: (Parameters<typeof paysPractitioner>[0] & { date: string })[],
  paid: string[]
): string[] {
  const seen = new Set<string>();
  for (const r of rows) if (paysPractitioner(r)) seen.add(monthOf(r.date));
  return Array.from(seen)
    .filter((m) => !paid.includes(m))
    .sort()
    .reverse();
}

const DAY_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const asDate = (d: string) => new Date(`${d}T00:00:00Z`);

function labelFor(key: string, grain: Grain): string {
  if (grain === "day") return DAY_FMT.format(asDate(key));
  if (grain === "week") {
    const end = asDate(key);
    end.setUTCDate(end.getUTCDate() + 6);
    return `${DAY_FMT.format(asDate(key))} – ${DAY_FMT.format(end)}`;
  }
  if (grain === "month") return monthLabel(key);
  return key;
}

/**
 * Which session types and which clients actually earn this practitioner money.
 *
 * Clients are named here. It is their own caseload — the same people whose
 * sessions they sat in — and knowing that three clients are most of your
 * income is the sort of thing a self-employed person needs to see. It goes no
 * further than the practitioner's own screen.
 */
export async function earningsBreakdown(expertId: string, range: Range) {
  const inRange = dateWhere(range);
  const rows = await prisma.booking.findMany({
    where: { expertId, status: { in: PAYABLE }, ...(inRange ? { date: inRange } : {}) },
    select: {
      status: true,
      serviceSlug: true,
      userId: true,
      proBono: true,
      user: { select: { name: true } },
      payment: { select: { status: true, amount: true, refundAmount: true } },
    },
  });

  const share = shareFor(expertId);
  const byService = new Map<string, { label: string; sessions: number; earned: number }>();
  const byClient = new Map<string, { name: string; sessions: number; earned: number }>();

  for (const r of rows) {
    if (!paysPractitioner(r)) continue;
    const { collected, refunded } = moneyOn(r.payment);
    const earned = Math.round((collected - refunded) * share);

    const slug = r.serviceSlug ?? "other";
    const service = byService.get(slug) ?? {
      label: serviceBySlug(slug)?.title ?? "Other",
      sessions: 0,
      earned: 0,
    };
    service.sessions += 1;
    service.earned += earned;
    byService.set(slug, service);

    const client = byClient.get(r.userId) ?? { name: r.user.name, sessions: 0, earned: 0 };
    client.sessions += 1;
    client.earned += earned;
    byClient.set(r.userId, client);
  }

  const sort = <T extends { earned: number; sessions: number }>(a: T, b: T) =>
    b.earned - a.earned || b.sessions - a.sessions;

  return {
    services: Array.from(byService, ([slug, v]) => ({ slug, ...v })).sort(sort),
    clients: Array.from(byClient, ([id, v]) => ({ id, ...v })).sort(sort),
  };
}

/**
 * One month's work, as a statement a practitioner can hand an accountant.
 *
 * Session by session, with what was collected and what their share of it was.
 * The platform's cut is shown on every line rather than only as a total,
 * because "where did the rest go" is the question a statement exists to
 * answer before it is asked.
 */
export async function monthlyStatement(expertId: string, month: string) {
  const rows = await prisma.booking.findMany({
    where: { expertId, status: { in: PAYABLE }, date: { startsWith: month } },
    select: {
      ref: true,
      date: true,
      time: true,
      status: true,
      serviceSlug: true,
      proBono: true,
      user: { select: { name: true } },
      payment: { select: { status: true, amount: true, refundAmount: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const share = shareFor(expertId);
  const lines = rows.filter(paysPractitioner).map((r) => {
    const { collected, refunded } = moneyOn(r.payment);
    const net = collected - refunded;
    const earned = Math.round(net * share);
    return {
      ref: r.ref,
      date: r.date,
      time: r.time,
      client: r.user.name,
      service: r.serviceSlug ? (serviceBySlug(r.serviceSlug)?.title ?? r.serviceSlug) : "Session",
      status: r.status,
      free: r.proBono,
      /* Paid because the client cancelled inside the 24-hour window and the fee
         was kept. Said on the line, so nobody reads it as a session that ran. */
      lateCancel: r.status === BOOKING_STATUS.cancelled,
      collected: net,
      earned,
      platform: net - earned,
    };
  });

  const payout = await prisma.payout.findUnique({
    where: { expertId_month: { expertId, month } },
  });

  return {
    month,
    monthName: monthLabel(month),
    share,
    lines,
    totals: {
      sessions: lines.length,
      free: lines.filter((l) => l.free).length,
      lateCancelled: lines.filter((l) => l.lateCancel).length,
      collected: lines.reduce((n, l) => n + l.collected, 0),
      earned: lines.reduce((n, l) => n + l.earned, 0),
      platform: lines.reduce((n, l) => n + l.platform, 0),
    },
    paid: payout
      ? {
          amount: payout.amount,
          paidAt: payout.paidAt.toISOString(),
          reference: payout.reference,
        }
      : null,
  };
}
