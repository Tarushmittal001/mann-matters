import { prisma } from "@/lib/db";
import { getExpert } from "@/lib/experts-store";
import { parseItems } from "@/lib/prescriptions";
import { parseOptions } from "@/lib/reschedule-offers";
import { formatDateISO } from "@/lib/utils";

/**
 * Suggestions waiting for a client: a practitioner they have seen thinking
 * another session would help.
 *
 * Shown on their own dashboard as a prompt, never as anything booked. The
 * client dismisses it or books; either way it stops asking. Nothing here
 * expires on its own, because a suggestion quietly disappearing would be
 * worse than one sitting politely until answered.
 */
export async function followUpsForClient(userId: string) {
  const rows = await prisma.followUp.findMany({
    where: { userId, actedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (rows.length === 0) return [];

  return Promise.all(
    rows.map(async (r) => {
      const expert = await getExpert(r.expertId);
      return {
        id: r.id,
        expertId: r.expertId,
        expertName: expert?.name ?? "Your therapist",
        message: r.message,
        sentAt: r.createdAt.toISOString(),
      };
    })
  );
}

/**
 * Live reschedule offers waiting on this client, newest first.
 *
 * Only offers that are still open and not yet lapsed: an offer whose window
 * has closed is not a decision anybody still has to make, and showing it would
 * suggest the original time is in doubt when it is not.
 */
export async function offersForClient(userId: string) {
  const rows = await prisma.rescheduleOffer.findMany({
    where: { actedAt: null, expiresAt: { gt: new Date() }, booking: { userId } },
    include: {
      booking: { select: { id: true, date: true, time: true, expertName: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows
    .filter((r) => r.booking.status === "CONFIRMED")
    .map((r) => ({
      id: r.id,
      bookingId: r.booking.id,
      expertName: r.booking.expertName,
      was: `${formatDateISO(r.booking.date)} at ${r.booking.time}`,
      reason: r.reason,
      options: parseOptions(r.options),
      expiresAt: r.expiresAt.toISOString(),
    }));
}

/** A client's own prescriptions, newest first. Withdrawn ones stay, marked. */
export async function prescriptionsForClient(userId: string) {
  const rows = await prisma.prescription.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    take: 20,
  });
  return rows.map((r) => ({
    id: r.id,
    number: r.number,
    issuedAt: r.issuedAt.toISOString(),
    prescriberName: r.prescriberName,
    drugs: parseItems(r.items).map((i) => i.drug).filter(Boolean),
    cancelledAt: r.cancelledAt?.toISOString() ?? null,
  }));
}
