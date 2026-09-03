import { getSession } from "@/lib/auth";
import { bookingCalendar } from "@/lib/calendar";
import { BOOKING_STATUS } from "@/lib/features/booking/policy";
import { findUserBooking } from "@/lib/features/booking/server";
import { errors, logFailure } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const booking = await findUserBooking(params.id, session);
    if (!booking) return errors.notFound("We couldn't find that session.");
    if (booking.status !== BOOKING_STATUS.confirmed) {
      return errors.notFound("Only confirmed sessions can be added to a calendar.");
    }

    return new Response(bookingCalendar(booking), {
      headers: {
        "Cache-Control": "no-store, private",
        "Content-Disposition": `attachment; filename="emoraa-${booking.ref}.ics"`,
        "Content-Type": "text/calendar; charset=utf-8",
      },
    });
  } catch (error) {
    logFailure("bookings.calendar", error);
    return errors.server();
  }
}