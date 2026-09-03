import { getSession } from "@/lib/auth";
import { findUserBooking, serializeBooking } from "@/lib/features/booking/server";
import { errors, logFailure, privateJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/[id] — one booking, for the payment screen to poll its own
 * state after a gateway round-trip. Ownership is enforced inside
 * `findUserBooking`, which reports someone else's booking as simply missing.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const booking = await findUserBooking(params.id, session);
    if (!booking) return errors.notFound("We couldn't find that session.");

    return privateJson({ booking: serializeBooking(booking) });
  } catch (err) {
    logFailure("bookings.get", err);
    return errors.server();
  }
}
