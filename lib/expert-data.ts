import { redirect } from "next/navigation";
import { getSession, type Session } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { concerns, experts, type Expert } from "@/lib/experts";
import { addMinutes, clinicNow } from "@/lib/clinic-time";
import {
  displayName,
  initialsOf,
  maskEmail,
  parseList,
  type AvailabilityBand,
  type ClientSafeClient,
  type SessionStatus,
  type TimeOffBlock,
} from "@/lib/expert-portal";

/* ────────────────────────────────────────────────────────────────────────────
   Server-side loaders for the expert portal.

   Two rules hold everywhere in this file:
     1. Every query is filtered by the signed-in practitioner's own `expertId`.
        There is no code path that can read another practitioner's calendar.
     2. Nothing returns a raw `User` row. Client identity leaves this module
        only through `toClientSafe`, so the redaction cannot be forgotten at
        the call site.
   ──────────────────────────────────────────────────────────────────────────── */

export type ExpertProfileView = {
  expertId: string;
  headline: string;
  bio: string;
  credentials: string;
  experienceYears: number;
  languages: string[];
  specialties: string[];
  timezone: string;
  sessionMinutes: number;
  notesPolicy: string;
  notesPolicyNote: string;
  notifications: {
    newBooking: boolean;
    cancellation: boolean;
    reminder: boolean;
    reminderLeadMinutes: number;
    weeklyDigest: boolean;
    productUpdates: boolean;
    channel: string;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
};

export type ExpertContext = {
  session: Session;
  profile: ExpertProfileView;
  /** The public catalogue entry, when this practitioner is listed. */
  listing: Expert | null;
  today: string;
  nowTime: string;
};

export type ExpertSessionView = {
  id: string;
  ref: string;
  date: string;
  time: string;
  endTime: string;
  status: SessionStatus;
  concern: string;
  concernLabel: string;
  concernHint: string;
  amount: number;
  meetingUrl: string | null;
  bookedAt: string;
  closedBy: string | null;
  client: ClientSafeClient;
  note: { status: string; updatedAt: string; amendments: number } | null;
};

export type ExpertNoteView = {
  id: string;
  body: string;
  status: "DRAFT" | "SUBMITTED";
  submittedAt: string | null;
  updatedAt: string;
  amendments: Array<{ id: string; body: string; createdAt: string }>;
};

function toProfileView(p: {
  expertId: string;
  headline: string;
  bio: string;
  credentials: string;
  experienceYears: number;
  languages: string;
  specialties: string;
  timezone: string;
  sessionMinutes: number;
  notesPolicy: string;
  notesPolicyNote: string;
  notifyNewBooking: boolean;
  notifyCancellation: boolean;
  notifyReminder: boolean;
  reminderLeadMinutes: number;
  notifyWeeklyDigest: boolean;
  notifyProductUpdates: boolean;
  notifyChannel: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}): ExpertProfileView {
  return {
    expertId: p.expertId,
    headline: p.headline,
    bio: p.bio,
    credentials: p.credentials,
    experienceYears: p.experienceYears,
    languages: parseList(p.languages),
    specialties: parseList(p.specialties),
    timezone: p.timezone,
    sessionMinutes: p.sessionMinutes,
    notesPolicy: p.notesPolicy,
    notesPolicyNote: p.notesPolicyNote,
    notifications: {
      newBooking: p.notifyNewBooking,
      cancellation: p.notifyCancellation,
      reminder: p.notifyReminder,
      reminderLeadMinutes: p.reminderLeadMinutes,
      weeklyDigest: p.notifyWeeklyDigest,
      productUpdates: p.notifyProductUpdates,
      channel: p.notifyChannel,
      quietHoursEnabled: p.quietHoursEnabled,
      quietHoursStart: p.quietHoursStart,
      quietHoursEnd: p.quietHoursEnd,
    },
  };
}

/** Session + linked practitioner record, or null when either is missing. */
export async function getExpertContext(): Promise<
  | { state: "anonymous" }
  | { state: "wrong-role"; session: Session }
  | { state: "unlinked"; session: Session }
  | ({ state: "ok" } & ExpertContext)
> {
  const session = await getSession();
  if (!session) return { state: "anonymous" };
  if (session.role !== "EXPERT" && session.role !== "ADMIN") {
    return { state: "wrong-role", session };
  }

  const profile = await prisma.expertProfile.findUnique({ where: { userId: session.sub } });
  if (!profile) return { state: "unlinked", session };

  const { date, time } = clinicNow();
  return {
    state: "ok",
    session,
    profile: toProfileView(profile),
    listing: experts.find((e) => e.id === profile.expertId) ?? null,
    today: date,
    nowTime: time,
  };
}

/** Redirects rather than returning, for pages that cannot render without it. */
export async function requireExpertContext(path: string): Promise<ExpertContext> {
  const ctx = await getExpertContext();
  if (ctx.state === "anonymous") redirect("/login?next=" + encodeURIComponent(path));
  if (ctx.state === "wrong-role") redirect("/dashboard");
  if (ctx.state === "unlinked") redirect("/expert");
  return ctx;
}

/** For API routes: the practitioner's own id, or null. */
export async function expertIdFromSession() {
  const session = await getSession();
  if (!session || (session.role !== "EXPERT" && session.role !== "ADMIN")) return null;
  const profile = await prisma.expertProfile.findUnique({
    where: { userId: session.sub },
    select: { expertId: true, sessionMinutes: true, notesPolicy: true },
  });
  return profile ? { ...profile, session } : null;
}

function toClientSafe(
  user: { name: string; email: string; createdAt: Date },
  sessionsWithYou: number
): ClientSafeClient {
  return {
    displayName: displayName(user.name),
    initials: initialsOf(user.name),
    maskedEmail: maskEmail(user.email),
    sessionsWithYou,
    isReturning: sessionsWithYou > 1,
    clientSince: user.createdAt.toISOString().slice(0, 10),
  };
}

type BookingRow = {
  id: string;
  ref: string;
  date: string;
  time: string;
  status: string;
  concern: string;
  amount: number;
  meetingUrl: string | null;
  closedBy: string | null;
  createdAt: Date;
  user: { name: string; email: string; createdAt: Date };
  note?: { status: string; updatedAt: Date; _count?: { amendments: number } } | null;
};

function toSessionView(
  b: BookingRow,
  sessionMinutes: number,
  sessionsWithYou: number
): ExpertSessionView {
  const concern = concerns.find((c) => c.id === b.concern);
  return {
    id: b.id,
    ref: b.ref,
    date: b.date,
    time: b.time,
    endTime: addMinutes(b.time, sessionMinutes),
    status: (b.status as SessionStatus) ?? "CONFIRMED",
    concern: b.concern,
    concernLabel: concern?.label ?? "General",
    concernHint: concern?.hint ?? "",
    amount: b.amount,
    meetingUrl: b.meetingUrl,
    bookedAt: b.createdAt.toISOString(),
    closedBy: b.closedBy,
    client: toClientSafe(b.user, sessionsWithYou),
    note: b.note
      ? {
          status: b.note.status,
          updatedAt: b.note.updatedAt.toISOString(),
          amendments: b.note._count?.amendments ?? 0,
        }
      : null,
  };
}

const sessionInclude = {
  user: { select: { name: true, email: true, createdAt: true } },
  note: { select: { status: true, updatedAt: true, _count: { select: { amendments: true } } } },
} as const;

/** Every session for this practitioner, newest booking grid first. */
export async function listExpertSessions(
  expertId: string,
  sessionMinutes: number,
  opts: { from?: string; to?: string; status?: SessionStatus } = {}
) {
  const rows = await prisma.booking.findMany({
    where: {
      expertId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.from || opts.to
        ? { date: { ...(opts.from ? { gte: opts.from } : {}), ...(opts.to ? { lte: opts.to } : {}) } }
        : {}),
    },
    include: sessionInclude,
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const counts = await clientSessionCounts(expertId);
  return rows.map((r) => toSessionView(r, sessionMinutes, counts.get(r.userId) ?? 1));
}

/** How many sessions each client has had with *this* practitioner. */
async function clientSessionCounts(expertId: string) {
  const grouped = await prisma.booking.groupBy({
    by: ["userId"],
    where: { expertId, status: { in: ["CONFIRMED", "COMPLETED"] } },
    _count: { _all: true },
  });
  return new Map(grouped.map((g) => [g.userId, g._count._all]));
}

export async function getExpertSession(expertId: string, bookingId: string, sessionMinutes: number) {
  const row = await prisma.booking.findFirst({
    where: { id: bookingId, expertId },
    include: sessionInclude,
  });
  if (!row) return null;
  const counts = await clientSessionCounts(expertId);
  return toSessionView(row, sessionMinutes, counts.get(row.userId) ?? 1);
}

export async function getSessionNote(bookingId: string, expertId: string): Promise<ExpertNoteView | null> {
  const note = await prisma.sessionNote.findFirst({
    where: { bookingId, expertId },
    include: { amendments: { orderBy: { createdAt: "asc" } } },
  });
  if (!note) return null;
  return {
    id: note.id,
    body: note.body,
    status: note.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
    submittedAt: note.submittedAt?.toISOString() ?? null,
    updatedAt: note.updatedAt.toISOString(),
    amendments: note.amendments.map((a) => ({
      id: a.id,
      body: a.body,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export async function getAvailability(expertId: string): Promise<AvailabilityBand[]> {
  const rows = await prisma.availabilityRule.findMany({
    where: { expertId },
    orderBy: [{ weekday: "asc" }, { start: "asc" }],
  });
  return rows.map((r) => ({ id: r.id, weekday: r.weekday, start: r.start, end: r.end }));
}

export async function getTimeOff(expertId: string, from?: string): Promise<
  Array<TimeOffBlock & { id: string; reason: string; createdAt: string }>
> {
  const rows = await prisma.timeOff.findMany({
    where: { expertId, ...(from ? { endDate: { gte: from } } : {}) },
    orderBy: [{ startDate: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    startDate: r.startDate,
    endDate: r.endDate,
    allDay: r.allDay,
    startTime: r.startTime,
    endTime: r.endTime,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Confirmed, not-yet-finished sessions — the set every conflict check runs against. */
export async function upcomingConfirmed(expertId: string, today: string) {
  const rows = await prisma.booking.findMany({
    where: { expertId, status: "CONFIRMED", date: { gte: today } },
    select: { id: true, ref: true, date: true, time: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return rows;
}
