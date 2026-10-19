import { prisma } from "@/lib/db";
import { BOOKING_STATUS, PAYMENT_STATUS } from "@/lib/features/booking/policy";
import { concerns } from "@/lib/experts";

/**
 * What the admin needs to know about the people using Emoraa.
 *
 * Gathered here rather than in the pages, so the directory and the one-client
 * page cannot drift into disagreeing about what "sessions" or "no-shows" mean.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ──────────────────────────────────────────
 * `User.notes` and the intake form are free text a client wrote about their
 * own health. Nothing in this file selects them, and nothing should: an admin
 * runs the practice, they are not in the room. Every select below is an
 * allow-list for that reason, never `include`.
 */

/** Held, i.e. somebody sat through it or was due to. A cancellation is not a session. */
const ATTENDED = [BOOKING_STATUS.confirmed, BOOKING_STATUS.completed];

export type ClientSort = "recent" | "sessions" | "spend";
export const CLIENT_SORTS: { value: ClientSort; label: string }[] = [
  { value: "recent", label: "Newest first" },
  { value: "sessions", label: "Most sessions" },
  { value: "spend", label: "Most spent" },
];
export const isClientSort = (v: unknown): v is ClientSort =>
  CLIENT_SORTS.some((s) => s.value === v);

export type ClientRow = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  state: string | null;
  avatar: string | null;
  emailVerified: boolean;
  joined: string;
  blockedAt: Date | null;
  bookings: number;
  attended: number;
  noShows: number;
  cancelled: number;
  spent: number;
};

/**
 * Every client, with the counts the directory sorts and worries by.
 *
 * Counted in three grouped queries rather than per client: a page that runs a
 * query per row is fine at twelve clients and unusable at four hundred, and
 * the fix is never obvious once the page is written.
 */
export async function listClients(sort: ClientSort = "recent"): Promise<ClientRow[]> {
  const [users, byStatus, paid] = await Promise.all([
    prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        state: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        blockedAt: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.groupBy({
      by: ["userId", "status"],
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ["bookingId"],
      _sum: { amount: true, refundAmount: true },
      where: { status: { in: [PAYMENT_STATUS.paid, PAYMENT_STATUS.refunded] } },
    }),
  ]);

  // payments hang off bookings, so one lookup turns booking ids into owners
  const owners = paid.length
    ? await prisma.booking.findMany({
        where: { id: { in: paid.map((p) => p.bookingId) } },
        select: { id: true, userId: true },
      })
    : [];
  const ownerOf = new Map(owners.map((b) => [b.id, b.userId]));

  const spend = new Map<string, number>();
  for (const p of paid) {
    const userId = ownerOf.get(p.bookingId);
    if (!userId) continue;
    // what they actually parted with: a refund gives it back
    const net = (p._sum.amount ?? 0) - (p._sum.refundAmount ?? 0);
    spend.set(userId, (spend.get(userId) ?? 0) + net);
  }

  const count = (userId: string, statuses: string[]) =>
    byStatus
      .filter((r) => r.userId === userId && statuses.includes(r.status))
      .reduce((n, r) => n + r._count._all, 0);

  const rows: ClientRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    city: u.city,
    state: u.state,
    avatar: u.avatar,
    emailVerified: !!u.emailVerified,
    joined: u.createdAt.toISOString(),
    blockedAt: u.blockedAt,
    bookings: u._count.bookings,
    attended: count(u.id, ATTENDED),
    noShows: count(u.id, [BOOKING_STATUS.noShow]),
    cancelled: count(u.id, [BOOKING_STATUS.cancelled]),
    spent: spend.get(u.id) ?? 0,
  }));

  if (sort === "sessions") rows.sort((a, b) => b.attended - a.attended || b.bookings - a.bookings);
  if (sort === "spend") rows.sort((a, b) => b.spent - a.spent);
  return rows;
}

export type ClientDetail = NonNullable<Awaited<ReturnType<typeof getClient>>>;

/**
 * One client, whole. The page an admin should be looking at before deciding
 * anything about somebody — blocking a name off a list, with no history in
 * front of you, is deciding blind.
 */
export async function getClient(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, role: "USER" },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      phone: true,
      phoneVerified: true,
      age: true,
      gender: true,
      city: true,
      state: true,
      language: true,
      organisation: true,
      avatar: true,
      createdAt: true,
      blockedAt: true,
      blockedReason: true,
      blockedById: true,
      // NOT notes, and NOT the intake form: clinical, and not an admin's to read
    },
  });
  if (!user) return null;

  const [bookings, blockedBy] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: id },
      select: {
        id: true,
        ref: true,
        date: true,
        time: true,
        status: true,
        concern: true,
        serviceSlug: true,
        expertId: true,
        expertName: true,
        amount: true,
        proBono: true,
        createdAt: true,
        payment: {
          select: {
            status: true,
            amount: true,
            method: true,
            refundAmount: true,
            paidAt: true,
            receiptNo: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { time: "desc" }],
    }),
    user.blockedById
      ? prisma.user.findUnique({ where: { id: user.blockedById }, select: { name: true, email: true } })
      : null,
  ]);

  const label = (id: string) => concerns.find((c) => c.id === id)?.label ?? id;
  const tally = (statuses: string[]) => bookings.filter((b) => statuses.includes(b.status)).length;

  const spent = bookings.reduce((sum, b) => {
    const p = b.payment;
    if (!p || (p.status !== PAYMENT_STATUS.paid && p.status !== PAYMENT_STATUS.refunded)) return sum;
    return sum + p.amount - (p.refundAmount ?? 0);
  }, 0);

  /* What a practitioner is still expecting to see. This is the list an admin
     has to deal with before blocking somebody: cancelling it is a decision,
     and leaving it is also a decision — but it should be a decision, not
     something that just happens. */
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const upcoming = bookings.filter(
    (b) => b.status === BOOKING_STATUS.confirmed && b.date >= today
  );

  return {
    ...user,
    blockedBy,
    bookings: bookings.map((b) => ({ ...b, concernLabel: label(b.concern) })),
    upcoming,
    totals: {
      bookings: bookings.length,
      attended: tally(ATTENDED),
      noShows: tally([BOOKING_STATUS.noShow]),
      cancelled: tally([BOOKING_STATUS.cancelled]),
      spent,
    },
  };
}
