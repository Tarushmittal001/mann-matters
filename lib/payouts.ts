import { prisma } from "@/lib/db";
import { BOOKING_STATUS, PAYMENT_STATUS, todayIST } from "@/lib/features/booking/policy";

/**
 * What came in, and what goes out to the people who did the work.
 *
 * Two deliberate choices sit underneath every number on the revenue page:
 *
 *  - **Revenue is counted when it is collected**, from the payment row. A
 *    booking is a promise; a payment is money.
 *  - **A payout is earned in the month the session happened**, not the month
 *    it was paid for. Somebody who works in March and is paid in February's
 *    batch has been paid for the wrong month, and that is how disputes start.
 *
 * The share below is the one place a commercial term lives in this codebase.
 * Change it here when a contract changes, and put the therapist's own id in
 * `SHARE_BY_EXPERT` when their terms differ from everyone else's.
 */

/** The practitioner's share of what a client paid. 0.7 = they keep 70%. */
export const DEFAULT_THERAPIST_SHARE = 0.7;

/** Per-practitioner overrides, by expert id, for anyone on different terms. */
export const SHARE_BY_EXPERT: Record<string, number> = {};

export function shareFor(expertId: string): number {
  return SHARE_BY_EXPERT[expertId] ?? DEFAULT_THERAPIST_SHARE;
}

/** "2026-09" — the month a YYYY-MM-DD session date falls in. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** "September 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, 1))
  );
}

/** This month in clinic time, and the eleven before it, newest first. */
export function recentMonths(count = 12, now: Date = new Date()): string[] {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export type MonthMoney = {
  month: string;
  /** Sessions whose date falls in this month and which were actually held. */
  sessions: number;
  /** Free first sessions inside that count. */
  free: number;
  /** Money collected against those sessions. */
  collected: number;
  /** Taken off by codes and referrals, so the gap between list price and takings is visible. */
  discounts: number;
  /** Refunded against sessions in this month. */
  refunds: number;
  /** collected − refunds. */
  net: number;
};

export type ExpertPayout = {
  expertId: string;
  expertName: string;
  sessions: number;
  free: number;
  collected: number;
  share: number;
  /** What they are owed for the month, in rupees, rounded to the rupee. */
  due: number;
  /** What Emoraa keeps. */
  platform: number;
  /** What was actually sent, once an admin recorded it. Null = still awaited. */
  settled: {
    amount: number;
    paidAt: string;
    reference: string | null;
    markedByEmail: string;
  } | null;
};

/** Held sessions: the ones somebody actually sat through, or was due to. */
export const HELD: string[] = [BOOKING_STATUS.confirmed, "COMPLETED", "NO_SHOW"];

/**
 * Every status that can pay the practitioner: held sessions, plus cancellations.
 * Query with this, then keep only the rows `paysPractitioner` accepts.
 */
export const PAYABLE: string[] = [...HELD, BOOKING_STATUS.cancelled];

type Row = {
  expertId: string;
  expertName: string;
  status: string;
  date: string;
  amount: number;
  fullAmount: number | null;
  proBono: boolean;
  payment: { status: string; amount: number; refundAmount: number | null } | null;
};

async function rowsForMonths(months: string[]): Promise<Row[]> {
  if (!months.length) return [];
  // SQLite has no date type here — the dates are ISO strings, so a range over
  // the earliest month to the end of the latest is a plain string comparison
  const sorted = [...months].sort();
  return prisma.booking.findMany({
    where: {
      status: { in: PAYABLE },
      date: { gte: `${sorted[0]}-01`, lte: `${sorted[sorted.length - 1]}-31` },
    },
    select: {
      expertId: true,
      expertName: true,
      status: true,
      date: true,
      amount: true,
      fullAmount: true,
      proBono: true,
      payment: { select: { status: true, amount: true, refundAmount: true } },
    },
  });
}

/* These read only the payment, so that is all they ask for. Typing them
   against the whole booking row meant every other caller had to cast, and a
   cast is a promise the compiler stops checking. */
export type PaymentLike = { status: string; amount: number; refundAmount: number | null } | null;
type Paid = { payment: PaymentLike };

/**
 * What one payment did to the bank balance: money in, and money back out.
 *
 * ── WHY "COLLECTED" COUNTS A REFUNDED PAYMENT ──────────────────────────────
 * It was collected. The money arrived, and then some or all of it went back.
 * Reading `collected` as "only payments still untouched" means a refund is
 * subtracted twice — once by dropping out of `collected`, again by being added
 * to `refunds` — and `net` comes out below zero for a session that simply
 * broke even. On a held session that error reached the practitioner's payout,
 * where `collected − refunded` went negative and quietly ate their earnings
 * from other sessions.
 *
 * ── PARTIAL REFUNDS ────────────────────────────────────────────────────────
 * `refundAmount` is the running total given back, so it is read whatever the
 * status says. `status` only flips to REFUNDED once nothing is left: a payment
 * that is half returned is still a payment that is half held, and calling it
 * "Refunded" on every screen would be a bigger lie than calling it "Confirmed".
 */
export function moneyOn(payment: PaymentLike): { collected: number; refunded: number } {
  if (!payment) return { collected: 0, refunded: 0 };
  const counts =
    payment.status === PAYMENT_STATUS.paid || payment.status === PAYMENT_STATUS.refunded;
  if (!counts) return { collected: 0, refunded: 0 };
  const refunded = Math.min(payment.refundAmount ?? 0, payment.amount);
  return { collected: payment.amount, refunded };
}

/**
 * Does this session pay the practitioner?
 *
 * A held session always counts (a free one counts and pays nothing). A
 * cancelled one counts when the client's money was kept: inside the 24-hour
 * window the fee is not refunded, because the practitioner had set the time
 * aside and could not fill it, and the client is told exactly that. Keeping
 * the fee and paying the practitioner nothing would make that untrue.
 *
 * Money decides, not the clock: a cancellation with notice was refunded in
 * full and nets to nil, so it drops out; an admin's partial refund on a late
 * cancellation leaves a smaller share, as it would on a held session. Only
 * clients (or an admin for them) cancel — a practitioner cannot cancel their
 * way into being paid.
 */
export function paysPractitioner(row: { status: string; payment: PaymentLike }): boolean {
  if (HELD.includes(row.status)) return true;
  if (row.status !== BOOKING_STATUS.cancelled) return false;
  const { collected, refunded } = moneyOn(row.payment);
  return collected - refunded > 0;
}

const collectedOn = (row: Paid) => moneyOn(row.payment).collected;
const refundedOn = (row: Paid) => moneyOn(row.payment).refunded;

/**
 * What each practitioner is owed for one month.
 *
 * The share is taken on money that stayed with us: a refunded session pays
 * nobody, because nobody was paid for it. A late cancellation whose fee was
 * kept pays as a held session does (`paysPractitioner`). A free session is counted and shown
 * but pays nothing, and the page says so rather than hiding it inside a total
 * — whether to pay for pro bono work is a decision, not an arithmetic detail.
 */
export async function payoutsForMonth(month: string): Promise<ExpertPayout[]> {
  const [rows, settled] = await Promise.all([
    rowsForMonths([month]),
    prisma.payout.findMany({ where: { month } }),
  ]);
  const settledBy = new Map(settled.map((p) => [p.expertId, p]));

  const byExpert = new Map<string, ExpertPayout>();

  for (const row of rows) {
    if (monthOf(row.date) !== month || !paysPractitioner(row)) continue;
    const entry =
      byExpert.get(row.expertId) ??
      {
        expertId: row.expertId,
        expertName: row.expertName,
        sessions: 0,
        free: 0,
        collected: 0,
        share: shareFor(row.expertId),
        due: 0,
        platform: 0,
        settled: null,
      };
    entry.sessions += 1;
    if (row.proBono) entry.free += 1;
    entry.collected += collectedOn(row) - refundedOn(row);
    byExpert.set(row.expertId, entry);
  }

  const out = Array.from(byExpert.values());
  for (const e of out) {
    e.due = Math.round(e.collected * e.share);
    e.platform = e.collected - e.due;
    const paid = settledBy.get(e.expertId);
    /* The recorded amount is shown as it was sent, not recomputed. If the
       share changes later, or a refund lands after payday, the figure beside
       "paid" has to keep saying what actually left the account — otherwise
       the record quietly rewrites history and the gap with `due` is the thing
       worth seeing. */
    e.settled = paid
      ? {
          amount: paid.amount,
          paidAt: paid.paidAt.toISOString(),
          reference: paid.reference,
          markedByEmail: paid.markedByEmail,
        }
      : null;
  }
  // awaited first: the list is a worklist, and what is settled is done with
  return out.sort((a, b) => Number(!!a.settled) - Number(!!b.settled) || b.due - a.due);
}

/* ── Revenue over any grain ─────────────────────────────────────────────────
   The month table above answers "how was March". These answer "how is it
   going", at whatever zoom the question is being asked at.

   All of it is string maths on `Booking.date`, which is already a YYYY-MM-DD
   in clinic time. There is no timezone conversion anywhere below, and there
   must not be: converting an IST date string through a server-local Date is
   how a 00:30 session migrates into the previous day on a machine in London.
*/

export type Grain = "day" | "week" | "month" | "year";

export const GRAINS: { value: Grain; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

export const isGrain = (v: unknown): v is Grain => GRAINS.some((g) => g.value === v);

/**
 * The zoom that suits a span, when the admin has not chosen one.
 *
 * A fortnight read monthly is two bars; five years read daily is eighteen
 * hundred. Neither is a table anybody learns anything from, so a range picks
 * its own grain until someone says otherwise.
 */
export function suggestGrain(days: number): Grain {
  if (days <= 31) return "day";
  if (days <= 182) return "week";
  if (days <= 1095) return "month";
  return "year";
}

/** However wide the range, the table stays readable and the query stays small. */
export const MAX_BUCKETS = 366;

export type Money = MonthMoney & { key: string; label: string };

const UTC = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** The Monday on or before this date. Weeks start Monday, as the clinic reads them. */
function weekStart(date: string): string {
  const d = UTC(date);
  // getUTCDay: 0 = Sunday, so Sunday belongs to the week that began six days ago
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}

function bucketOf(date: string, grain: Grain): string {
  if (grain === "day") return date;
  if (grain === "week") return weekStart(date);
  if (grain === "month") return date.slice(0, 7);
  return date.slice(0, 4);
}

/**
 * Every bucket touching [from, to], newest first.
 *
 * It walks back from the bucket containing `to` until it passes the one
 * containing `from`, so the ends are always whole buckets: ask for 3–17 Oct
 * weekly and you get the three weeks those dates fall in, not two and a
 * fragment. Capped, so "all time" at a daily zoom cannot build ten thousand
 * rows nobody asked to read.
 */
export function bucketsBetween(from: string, to: string, grain: Grain): string[] {
  const floor = bucketOf(from, grain);
  const out: string[] = [];
  let cursor = UTC(
    grain === "month" ? `${to.slice(0, 7)}-01` : grain === "year" ? `${to.slice(0, 4)}-01-01` : to
  );
  if (grain === "week") cursor = UTC(weekStart(to));

  for (let i = 0; i < MAX_BUCKETS; i++) {
    const key =
      grain === "month" ? iso(cursor).slice(0, 7) : grain === "year" ? iso(cursor).slice(0, 4) : iso(cursor);
    out.push(key);
    if (key <= floor) break;
    if (grain === "day") cursor.setUTCDate(cursor.getUTCDate() - 1);
    else if (grain === "week") cursor.setUTCDate(cursor.getUTCDate() - 7);
    else if (grain === "month") cursor.setUTCMonth(cursor.getUTCMonth() - 1);
    else cursor.setUTCFullYear(cursor.getUTCFullYear() - 1);
  }
  return out;
}

const DAY_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

function labelFor(key: string, grain: Grain): string {
  if (grain === "day") return DAY_FMT.format(UTC(key));
  if (grain === "week") {
    const end = UTC(key);
    end.setUTCDate(end.getUTCDate() + 6);
    return `${DAY_FMT.format(UTC(key))} – ${DAY_FMT.format(end)}`;
  }
  if (grain === "month") return monthLabel(key);
  return key;
}

/**
 * Takings bucketed at the asked-for grain, newest first. Empty buckets are
 * kept rather than dropped: a week with no sessions is a fact about the week,
 * and a chart that silently closes the gap tells a kinder story than the truth.
 */
export async function moneyOverRange(
  range: { from: string | null; to: string },
  grain: Grain
): Promise<Money[]> {
  // "all time" still needs a floor to count back from; the earliest booking is
  // the honest one, and there is nothing to show before it
  const earliest =
    range.from ??
    (
      await prisma.booking.findFirst({
        orderBy: { date: "asc" },
        select: { date: true },
      })
    )?.date ??
    range.to;

  const keys = bucketsBetween(earliest, range.to, grain);
  const oldest = keys[keys.length - 1];
  // the floor of the oldest bucket, as a date string
  const from = grain === "month" ? `${oldest}-01` : grain === "year" ? `${oldest}-01-01` : oldest;
  const today = range.to;

  /* Deliberately NOT filtered to held sessions, unlike the payout maths.
     A refund on a cancelled booking is money leaving the account on the day it
     leaves, and filtering it out here is how the lifetime "refunded" tile ends
     up disagreeing with every row of the table beneath it. So: money is
     counted from whatever happened to the payment, and only the session count
     is restricted to sessions somebody actually sat through. */
  const rows = await prisma.booking.findMany({
    where: { date: { gte: from, lte: today } },
    select: {
      date: true,
      status: true,
      amount: true,
      fullAmount: true,
      proBono: true,
      payment: { select: { status: true, amount: true, refundAmount: true } },
    },
  });

  const byKey = new Map<string, Money>(
    keys.map((key) => [
      key,
      { key, label: labelFor(key, grain), month: key, sessions: 0, free: 0, collected: 0, discounts: 0, refunds: 0, net: 0 },
    ])
  );

  for (const row of rows) {
    const bucket = byKey.get(bucketOf(row.date, grain));
    if (!bucket) continue;
    const held = HELD.includes(row.status);
    if (held) {
      bucket.sessions += 1;
      if (row.proBono) bucket.free += 1;
      bucket.discounts += Math.max(0, (row.fullAmount ?? row.amount) - row.amount);
    }
    bucket.collected += collectedOn(row);
    bucket.refunds += refundedOn(row);
  }

  const out = Array.from(byKey.values());
  for (const b of out) b.net = b.collected - b.refunds;
  return out;
}
