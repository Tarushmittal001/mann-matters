import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { findUserBooking, serializeBooking } from "@/lib/bookings";
import { BOOKING_STATUS, PAYMENT_STATUS, canCancel, refundFor } from "@/lib/booking-policy";
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
        },
        include: { payment: true },
      });
    });

    return privateJson({
      booking: serializeBooking(updated),
      refund: { amount: due.amount, full: due.full, note: due.note },
    });
  } catch (err) {
    logFailure("bookings.cancel", err);
    return errors.server();
  }
}
