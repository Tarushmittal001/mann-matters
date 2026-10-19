import { prisma } from "@/lib/db";
import { BOOKING_STATUS } from "@/lib/features/booking/policy";
import { currentAge } from "@/lib/validation";

/**
 * The intake form: what a therapist reads before the first session.
 *
 * Fifty minutes is not long. Twenty of them spent on "so, tell me a bit about
 * yourself" is twenty minutes of the thing somebody came for. This moves that
 * part to a quiet evening at home, where people also answer it more honestly
 * than they do to a stranger's face.
 *
 * It is clinical data and it is treated as such: it belongs to the client,
 * it is visible to the practitioner they have actually booked, and it goes
 * nowhere else. The admin pages do not read it.
 */

export const RISK = {
  none: "NONE",
  past: "PAST",
  recent: "RECENT",
} as const;

export const RISK_OPTIONS = [
  { value: RISK.none, label: "No, not at all" },
  { value: RISK.past, label: "In the past, but not recently" },
  { value: RISK.recent, label: "Yes, in the last few weeks" },
] as const;

export const DURATION_OPTIONS = [
  "Less than a month",
  "One to six months",
  "Six months to a year",
  "More than a year",
  "As long as I can remember",
] as const;

/** The age below which a guardian has to be named and has to agree. */
export const MINOR_AGE = 18;

export type IntakeInput = {
  reason: string;
  duration: string;
  pastCare: string;
  medication: string;
  medical: string;
  riskSelfHarm: string;
  riskNote: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  guardianName: string;
  guardianPhone: string;
  guardianConsent: boolean;
  notes: string;
};

export const EMPTY_INTAKE: IntakeInput = {
  reason: "",
  duration: "",
  pastCare: "",
  medication: "",
  medical: "",
  riskSelfHarm: RISK.none,
  riskNote: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  guardianName: "",
  guardianPhone: "",
  guardianConsent: false,
  notes: "",
};

const PHONE = /^[+]?[0-9 ()-]{8,18}$/;

/**
 * What has to be there before a therapist can use it.
 *
 * Deliberately short. A form that demands eleven answers gets eleven lies; the
 * three that are actually load-bearing are why you came, somebody to call, and
 * the risk question. Everything else is welcome and optional.
 */
export function validateIntake(
  input: IntakeInput,
  opts: { minor: boolean }
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.reason.trim().length < 10) {
    errors.reason = "A sentence or two is enough — but we do need something here.";
  }
  if (!input.emergencyName.trim()) {
    errors.emergencyName = "Someone we could call if you were in danger.";
  }
  if (!PHONE.test(input.emergencyPhone.trim())) {
    errors.emergencyPhone = "A number we could actually reach.";
  }
  if (!Object.values(RISK).includes(input.riskSelfHarm as (typeof RISK)[keyof typeof RISK])) {
    errors.riskSelfHarm = "Please answer this one.";
  }

  if (opts.minor) {
    if (!input.guardianName.trim()) {
      errors.guardianName = "A parent or guardian's name is needed for under-18s.";
    }
    if (!PHONE.test(input.guardianPhone.trim())) {
      errors.guardianPhone = "A number we can reach your parent or guardian on.";
    }
    if (!input.guardianConsent) {
      errors.guardianConsent = "We can't start without a guardian's agreement.";
    }
  }

  return errors;
}

/** Trim, cap and normalise before anything is written. */
export function cleanIntake(raw: Partial<IntakeInput>): IntakeInput {
  const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  return {
    reason: text(raw.reason, 2000),
    duration: text(raw.duration, 60),
    pastCare: text(raw.pastCare, 1500),
    medication: text(raw.medication, 1000),
    medical: text(raw.medical, 1000),
    riskSelfHarm: Object.values(RISK).includes(raw.riskSelfHarm as never)
      ? String(raw.riskSelfHarm)
      : RISK.none,
    riskNote: text(raw.riskNote, 1000),
    emergencyName: text(raw.emergencyName, 120),
    emergencyPhone: text(raw.emergencyPhone, 20),
    emergencyRelation: text(raw.emergencyRelation, 60),
    guardianName: text(raw.guardianName, 120),
    guardianPhone: text(raw.guardianPhone, 20),
    guardianConsent: raw.guardianConsent === true,
    notes: text(raw.notes, 2000),
  };
}

export type IntakeState = {
  /** Their answers, or blanks if they haven't started. */
  form: IntakeInput;
  filled: boolean;
  updatedAt: Date | null;
  /** Under 18, so the guardian block applies. */
  minor: boolean;
  /** They have a session coming and haven't done this yet. */
  needsItBefore: { date: string; time: string; expertName: string } | null;
};

/** Everything the intake page needs, in one call. */
export async function intakeState(userId: string, today: string): Promise<IntakeState> {
  const [user, row, next] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { age: true, dateOfBirth: true } }),
    prisma.intakeForm.findUnique({ where: { userId } }),
    prisma.booking.findFirst({
      where: { userId, status: BOOKING_STATUS.confirmed, date: { gte: today } },
      select: { date: true, time: true, expertName: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    }),
  ]);

  const filled = !!row && row.reason.trim().length > 0;

  return {
    form: row
      ? {
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
        }
      : EMPTY_INTAKE,
    filled,
    updatedAt: row?.updatedAt ?? null,
    minor: ((age) => age !== null && age < MINOR_AGE)(user ? currentAge(user) : null),
    needsItBefore: filled ? null : next,
  };
}

/** How a risk answer reads in the practitioner's sidebar. */
export function riskLabel(value: string): { label: string; urgent: boolean } {
  if (value === RISK.recent) return { label: "Recent thoughts of self-harm", urgent: true };
  if (value === RISK.past) return { label: "Past thoughts of self-harm", urgent: false };
  return { label: "No thoughts of self-harm reported", urgent: false };
}
