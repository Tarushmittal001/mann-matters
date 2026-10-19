import { getSession } from "@/lib/auth";
import { cancelBooking, findUserBooking, serializeBooking } from "@/lib/features/booking/server";
import { FREE_CHANGE_HOURS, canCancel } from "@/lib/features/booking/policy";
import { errors, isSameOrigin, logFailure, privateJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/[id]/cancel
 *
 * Cancelling does three things atomically: marks the booking, releases the slot
 * (`slotKey = null`, so the time is immediately bookable again), and records the
 * refund the policy allows. The refund amount is computed server-side from the
 * policy — never taken from the request — and is only what is still held, so a
 * fee an admin already partly refunded is never paid out twice.
 *
 * The work is `cancelBooking` (lib/features/booking/server), which claims the
 * booking before any money moves: a double click, or a client and an admin at
 * the same moment, cancels once and refunds once.
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

    const outcome = await cancelBooking({
      booking,
      by: session.role === "ADMIN" && booking.userId !== session.sub ? "ADMIN" : "USER",
      refund: "policy",
    });
    if (!outcome.ok) {
      return privateJson(
        { error: "This session changed a moment ago. Please refresh to see where it stands.", code: outcome.code },
        { status: 409 }
      );
    }

    const note = !booking.proBono
      ? outcome.note
      : outcome.proBonoReturned
        ? "This was your free session. You cancelled with more than a day to go, so it's yours again — book it whenever you're ready."
        : `This was your free session. It's inside the ${FREE_CHANGE_HOURS}-hour window, so it counts as used.`;

    return privateJson({
      booking: serializeBooking(outcome.booking),
      refund: { amount: outcome.refunded, full: outcome.full, note, pending: outcome.refundPending },
      proBonoReturned: outcome.proBonoReturned,
    });
  } catch (err) {
    logFailure("bookings.cancel", err);
    return errors.server();
  }
}
