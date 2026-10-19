import { prisma } from "@/lib/db";

/**
 * Between-session work.
 *
 * The evidence for therapy that involves practice between sessions is much
 * better than for therapy that doesn't, and the commonest reason it doesn't
 * happen is that nobody wrote it down. By Wednesday the client remembers "she
 * said something about noticing thoughts" and does nothing.
 *
 * So: the practitioner writes one or two specific things, with a reason,
 * before they forget it too. The client sees them on their dashboard and ticks
 * them off. That is the whole feature — no streaks, no nagging, no score. A
 * therapy app that gamifies homework turns a therapeutic task into a
 * performance for an audience, which is the opposite of the point.
 */

export type HomeworkItem = {
  id: string;
  task: string;
  why: string;
  /** "twice a day", "before bed" — optional, free text. */
  frequency: string;
  /** "ten minutes", "two weeks" — optional, free text. */
  duration: string;
  dueOn: string | null;
  doneAt: string | null;
  /** Which session it came out of, for the client's own context. */
  bookingId: string;
  sessionDate: string;
  expertName: string;
};

export const MAX_TASK = 240;
export const MAX_WHY = 600;
export const MAX_SHORT = 80;

export function validateHomework(task: string, why: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const t = task.trim();
  if (t.length < 4) errors.task = "Say what to do, in a line.";
  if (t.length > MAX_TASK) errors.task = `Keep it under ${MAX_TASK} characters.`;
  if (why.trim().length > MAX_WHY) errors.why = `Keep it under ${MAX_WHY} characters.`;
  return errors;
}

/** What the practitioner set for one session. */
export async function homeworkForBooking(bookingId: string, expertId: string) {
  return prisma.homework.findMany({
    where: { bookingId, expertId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Everything outstanding for one client, plus what they've finished recently.
 *
 * Finished work is kept in sight for a while rather than vanishing, because
 * "look what you actually did" is worth more to somebody in week six than an
 * empty list is.
 */
export async function homeworkForClient(userId: string): Promise<{
  open: HomeworkItem[];
  done: HomeworkItem[];
}> {
  const rows = await prisma.homework.findMany({
    where: { userId },
    include: { booking: { select: { date: true, expertName: true } } },
    orderBy: [{ doneAt: "asc" }, { createdAt: "desc" }],
  });

  const shape = (r: (typeof rows)[number]): HomeworkItem => ({
    id: r.id,
    task: r.task,
    why: r.why,
    frequency: r.frequency,
    duration: r.duration,
    dueOn: r.dueOn,
    doneAt: r.doneAt?.toISOString() ?? null,
    bookingId: r.bookingId,
    sessionDate: r.booking.date,
    expertName: r.booking.expertName,
  });

  return {
    open: rows.filter((r) => !r.doneAt).map(shape),
    done: rows
      .filter((r) => r.doneAt)
      .slice(0, 10)
      .map(shape),
  };
}

/**
 * One session's practice plan — what the client does between sessions, as a
 * document they can keep.
 *
 * ── WHY THIS IS NOT CALLED A PRESCRIPTION ─────────────────────────────────
 * Only a registered medical practitioner may prescribe, and the word carries
 * that meaning whether or not we mean it to. A psychologist setting breathing
 * practice is doing something real and worth writing down, but it is not the
 * same act, and borrowing the word would blur a line the rest of this codebase
 * works to hold. So: a plan. The document says so in as many words.
 */
export async function practicePlan(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      ref: true,
      date: true,
      time: true,
      userId: true,
      expertId: true,
      expertName: true,
      user: { select: { name: true, age: true, gender: true } },
      homework: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking || booking.homework.length === 0) return null;

  return {
    bookingId: booking.id,
    ref: booking.ref,
    date: booking.date,
    time: booking.time,
    userId: booking.userId,
    expertId: booking.expertId,
    expertName: booking.expertName,
    client: booking.user,
    items: booking.homework.map((h) => ({
      id: h.id,
      task: h.task,
      why: h.why,
      frequency: h.frequency,
      duration: h.duration,
      dueOn: h.dueOn,
      doneAt: h.doneAt?.toISOString() ?? null,
    })),
  };
}
