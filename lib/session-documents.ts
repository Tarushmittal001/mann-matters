import { prisma } from "@/lib/db";
import { getExpert } from "@/lib/experts-store";
import { professionLabel } from "@/lib/professions";

/**
 * The details every document an expert issues for a session carries at the
 * top: who it is for, which booking, which session in their care.
 *
 * ── FILLED IN, NOT TYPED ───────────────────────────────────────────────────
 * The practitioner never types the patient's name, age or booking reference.
 * Typed, they drift — a misspelt name on a prescription is one a pharmacy can
 * refuse, and a wrong reference ties the document to somebody else's session.
 * So they are read from the booking and the client's own profile, and the
 * same function feeds the portal (what the expert sees while writing) and the
 * printed sheet (what the client receives), so the two cannot disagree.
 *
 * Callers do the access check first. This reads by booking id and trusts it.
 */

/** Sessions that count towards "session no." — ones that were meant to happen. */
const COUNTED = ["CONFIRMED", "COMPLETED", "NO_SHOW"];

export type SessionDocHeader = {
  bookingRef: string;
  /** YYYY-MM-DD and HH:mm, IST */
  date: string;
  time: string;
  /** 1 for the first session with this practitioner, and so on */
  sessionNumber: number;
  clientName: string;
  /** "24 · Female", "24", "Female", or "" when the profile has neither */
  ageSex: string;
  language: string;
  mode: string;
};

/** "24 · Female" from a profile that may have either, both or neither. */
export function formatAgeSex(age: number | null | undefined, gender: string | null | undefined): string {
  const sex = (gender ?? "").trim().replace(/-/g, " ");
  return [
    typeof age === "number" && age > 0 ? `${age} yrs` : "",
    sex ? sex.charAt(0).toUpperCase() + sex.slice(1) : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** "1st", "2nd", "3rd", "11th", "22nd" */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

export async function sessionDocHeader(bookingId: string): Promise<SessionDocHeader | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      ref: true,
      date: true,
      time: true,
      userId: true,
      expertId: true,
      user: { select: { name: true, age: true, gender: true, language: true } },
    },
  });
  if (!booking) return null;

  // earlier sessions with the same practitioner, so this one is "earlier + 1"
  const earlier = await prisma.booking.count({
    where: {
      expertId: booking.expertId,
      userId: booking.userId,
      status: { in: COUNTED },
      id: { not: bookingId },
      OR: [{ date: { lt: booking.date } }, { date: booking.date, time: { lt: booking.time } }],
    },
  });

  return {
    bookingRef: booking.ref,
    date: booking.date,
    time: booking.time,
    sessionNumber: earlier + 1,
    clientName: booking.user.name,
    ageSex: formatAgeSex(booking.user.age, booking.user.gender),
    language: booking.user.language ?? "",
    mode: "Online session",
  };
}

export type PractitionerLine = {
  name: string;
  credentials: string;
  designation: string;
  /** "Reg. no. MCI-12345", or "" when the listing has none */
  registration: string;
};

/** The practitioner block on the letterhead, from their live listing. */
export async function practitionerLine(expertId: string, fallbackName: string): Promise<PractitionerLine> {
  const listing = await getExpert(expertId);
  return {
    name: listing?.name ?? fallbackName,
    credentials: listing?.credentials ?? "",
    designation: listing ? professionLabel(listing.profession) : "",
    registration: listing?.registrationNo?.trim() ? `Reg. no. ${listing.registrationNo.trim()}` : "",
  };
}
