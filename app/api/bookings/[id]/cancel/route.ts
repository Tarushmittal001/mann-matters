import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { findUserBooking, serializeBooking } from "@/lib/features/booking/server";
import {
  BOOKING_STATUS,
  FREE_CHANGE_HOURS,
  PAYMENT_STATUS,
  canCancel,
  proBonoReturnsOnCancel,
  refundFor,
} from "@/lib/features/booking/policy";
import { errors, isSameOrigin, logFailure, privateJson } from "@/lib/http";
import { refund } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/[id]/cancel
 *
 * Cancelling does three things atomically: marks the booking, releases the slot
 * (`slotKey = null`, so the time is immediately bookable again), and records the
 * refund the policy allows. The refund amount is computed server-side from the
 * policy — never taken from the request.
 *
 * For the free first session there is nothing to refund; what is at stake is
 * the free session itself. Cancelled with more than 24 hours to go, its claim
 * is released (`proBonoPhone = null`) and the person can book it again. Inside
 * the window it stays spent, exactly as a paid session's fee would.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const booking = await findUserBooking(params.id, session);
    if (!booking) return errors.notFound("We couldn't find that session.");

    const decision = canCancel(booking);
    if (!decision.ok) {
      return privateJson({ error: decision.reason, code: decision.code }, { status: 409 });
    }

    const due = refundFor(booking, booking.payment?.status ?? null);
    const wasPaid = booking.payment?.status === PAYMENT_STATUS.paid;
    const givesFreeBack = booking.proBono && proBonoReturnsOnCancel(booking);

    let refundReference: string | null = null;
    if (due.amount > 0) {
      const result = await refund(due.amount);
      refundReference = result.reference;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (booking.payment && wasPaid && due.amount > 0) {
        await tx.payment.update({
          where: { bookingId: booking.id },
          data: {
            status: PAYMENT_STATUS.refunded,
            refundAmount: due.amount,
            refundedAt: new Date(),
            reference: refundReference ?? booking.payment.reference,
          },
        });
      }
      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BOOKING_STATUS.cancelled,
          // the slot goes back on the board the moment the session is released
          slotKey: null,
          holdExpiresAt: null,
          cancelledAt: new Date(),
          cancelledBy: session.role === "ADMIN" && booking.userId !== session.sub ? "ADMIN" : "USER",
          // early enough, and the free session is theirs to use again
          ...(givesFreeBack ? { proBonoPhone: null } : {}),
        },
        include: { payment: true },
      });
    });

    const note = !booking.proBono
      ? due.note
      : givesFreeBack
        ? "This was your free session. You cancelled with more than a day to go, so it's yours again — book it whenever you're ready."
        : `This was your free session. It's inside the ${FREE_CHANGE_HOURS}-hour window, so it counts as used.`;

    return privateJson({
      booking: serializeBooking(updated),
      refund: { amount: due.amount, full: due.full, note },
      proBonoReturned: givesFreeBack,
    });
  } catch (err) {
    logFailure("bookings.cancel", err);
    return errors.server();
  }
}
