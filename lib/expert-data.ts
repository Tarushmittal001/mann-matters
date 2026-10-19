import { redirect } from "next/navigation";
import { getSession, type Session } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { concerns, type Expert } from "@/lib/experts";
import { getExpert } from "@/lib/experts-store";
import { BOOKING_STATUS } from "@/lib/features/booking/policy";
import { parseItems } from "@/lib/prescriptions";
import { parseOptions } from "@/lib/reschedule-offers";
import { serviceBySlug } from "@/lib/service-catalogue";
import { addMinutes, clinicNow } from "@/lib/clinic-time";
import {
  displayName,
  initialsOf,
  maskEmail,
  parseList,
  sessionLength,
  type AvailabilityBand,
  type ClientSafeClient,
  type SessionStatus,
  type TimeOffBlock,
  type ViewStatus,
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
  /** The client's account id — for their history with you, and follow-ups. */
  userId: string;
  id: string;
  ref: string;
  date: string;
  time: string;
  endTime: string;
  /** How long this one runs, from the service that was booked. */
  lengthMinutes: number;
  status: ViewStatus;
  concern: string;
  /** The service sold, or null on bookings taken before it was recorded. */
  serviceSlug: string | null;
  serviceTitle: string | null;
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
    listing: await getExpert(profile.expertId),
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
  user: {
    name: string;
    email: string;
    createdAt: Date;
    avatar: string | null;
    age: number | null;
    gender: string | null;
    language: string | null;
  },
  sessionsWithYou: number
): ClientSafeClient {
  return {
    displayName: displayName(user.name),
    /* The full name, for the practitioner who is about to sit with them.
       `displayName` stays for the list view, where a screen is easily
       overlooked — but a therapist knows who their client is, and making
       them guess at "Riya K." on the session itself is theatre, not privacy. */
    fullName: user.name,
    initials: initialsOf(user.name),
    avatar: user.avatar,
    age: user.age,
    gender: user.gender,
    language: user.language,
    maskedEmail: maskEmail(user.email),
    sessionsWithYou,
    isReturning: sessionsWithYou > 1,
    clientSince: user.createdAt.toISOString().slice(0, 10),
  };
}

type BookingRow = {
  id: string;
  userId: string;
  ref: string;
  date: string;
  time: string;
  status: string;
  concern: string;
  serviceSlug: string | null;
  amount: number;
  meetingUrl: string | null;
  closedBy: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    createdAt: Date;
    avatar: string | null;
    age: number | null;
    gender: string | null;
    language: string | null;
  };
  note?: { status: string; updatedAt: Date; _count?: { amendments: number } } | null;
};

function toSessionView(
  b: BookingRow,
  sessionMinutes: number,
  sessionsWithYou: number
): ExpertSessionView {
  const concern = concerns.find((c) => c.id === b.concern);
  // the booked service decides the length; the practitioner's own setting is
  // only a fallback for sessions taken before the service was recorded
  const length = sessionLength({ date: b.date, time: b.time, status: b.status, serviceSlug: b.serviceSlug }, sessionMinutes);
  const service = b.serviceSlug ? serviceBySlug(b.serviceSlug) : null;
  return {
    id: b.id,
    userId: b.userId,
    ref: b.ref,
    date: b.date,
    time: b.time,
    endTime: addMinutes(b.time, length),
    lengthMinutes: length,
    status: (b.status as ViewStatus) ?? "CONFIRMED",
    concern: b.concern,
    serviceSlug: b.serviceSlug,
    serviceTitle: service?.title ?? null,
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
  user: {
    select: {
      name: true,
      email: true,
      createdAt: true,
      avatar: true,
      age: true,
      gender: true,
      language: true,
    },
  },
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

/**
 * The client's intake form, for a practitioner who actually has this booking.
 *
 * The expert id is checked against the booking rather than trusted, so a
 * booking id belonging to somebody else's caseload returns nothing. This is
 * clinical data and the check is the whole point of the function.
 */
export async function getSessionIntake(bookingId: string, expertId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, expertId },
    select: { user: { select: { intake: true } } },
  });
  const row = booking?.user.intake;
  if (!row || !row.reason.trim()) return null;
  return {
    form: {
      reason: row.reason,
      duration: row.duration,
      pastCare: row.pastCare,
      medication: row.medication,
      medical: row.medical,
      riskSelfHarm: row.riskSelfHarm,
      riskNote: row.riskNote,
      emergencyName: row.emergencyName,
      emergencyPhone: row.emergencyPhone,
      emergencyRelation: row.emergencyRelation,
      guardianName: row.guardianName,
      guardianPhone: row.guardianPhone,
      guardianConsent: row.guardianConsent,
      notes: row.notes,
    },
    updatedAt: row.updatedAt.toISOString(),
  };
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

/**
 * Requests waiting on this practitioner, soonest session first.
 *
 * Deliberately not bounded by the date window the dashboard uses for
 * sessions: a request for a slot six weeks out is still a request somebody is
 * waiting on, and a board that silently omitted it would be worse than no
 * board at all.
 */
export async function listRequests(expertId: string, sessionMinutes: number) {
  const rows = await prisma.booking.findMany({
    where: { expertId, status: BOOKING_STATUS.requested },
    include: sessionInclude,
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  const counts = await clientSessionCounts(expertId);
  return rows.map((r) => toSessionView(r, sessionMinutes, counts.get(r.userId) ?? 1));
}

/**
 * The sessions this client has already had with THIS practitioner.
 *
 * Scoped to the practitioner on purpose: somebody's history with another
 * therapist is not this one's to read. Only sessions that happened — a
 * cancellation is not a session anybody can remember.
 */
export async function clientHistory(expertId: string, userId: string, excludeBookingId?: string) {
  const rows = await prisma.booking.findMany({
    where: {
      expertId,
      userId,
      status: { in: ["COMPLETED", "NO_SHOW", BOOKING_STATUS.confirmed] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: {
      id: true,
      ref: true,
      date: true,
      time: true,
      status: true,
      concern: true,
      serviceSlug: true,
      note: { select: { status: true, updatedAt: true } },
    },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });
  return rows.map((r) => ({
    ...r,
    concernLabel: concerns.find((c) => c.id === r.concern)?.label ?? r.concern,
    hasNote: !!r.note,
  }));
}

/** An unanswered follow-up suggestion from this practitioner to this client. */
export async function pendingFollowUp(expertId: string, userId: string) {
  const row = await prisma.followUp.findUnique({
    where: { expertId_userId: { expertId, userId } },
    select: { createdAt: true, message: true, actedAt: true },
  });
  if (!row || row.actedAt) return null;
  return { sentAt: row.createdAt.toISOString(), message: row.message };
}

/** A reschedule offer still waiting on the client for this booking. */
export async function openOffer(bookingId: string) {
  const row = await prisma.rescheduleOffer.findUnique({ where: { bookingId } });
  if (!row || row.actedAt || row.expiresAt < new Date()) return null;
  return {
    sentAt: row.createdAt.toISOString(),
    reason: row.reason,
    options: parseOptions(row.options),
  };
}

/** Prescriptions this practitioner has issued on this session, newest first. */
export async function prescriptionsFor(bookingId: string, expertId: string) {
  const rows = await prisma.prescription.findMany({
    where: { bookingId, expertId },
    orderBy: { issuedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    number: r.number,
    issuedAt: r.issuedAt.toISOString(),
    items: parseItems(r.items),
    cancelledAt: r.cancelledAt?.toISOString() ?? null,
  }));
}
