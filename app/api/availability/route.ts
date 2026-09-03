import { getSession } from "@/lib/auth";
import { dayAvailability, expertById } from "@/lib/features/booking/server";
import { bookableRange, validateSlot } from "@/lib/features/booking/policy";
import { errors, logFailure, privateJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability?expertId=…&date=YYYY-MM-DD
 *
 * Real availability, derived from the slot column that also enforces it — so
 * what the calendar shows and what the booking endpoint will accept cannot
 * drift apart. Open to logged-out visitors on purpose: someone should be able
 * to see whether a time exists before being asked to make an account.
 *
 * It returns only which times are free — never who holds the taken ones.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const expertId = url.searchParams.get("expertId") ?? "";
    const date = url.searchParams.get("date") ?? "";

    const expert = expertById(expertId);
    if (!expert) return errors.notFound("We couldn't find that therapist.");

    const check = validateSlot(date, "08:00");
    if (!check.ok && check.code !== "BAD_TIME") {
      return privateJson({ date, expertId, slots: [], closed: true, reason: check.reason });
    }

    const slots = await dayAvailability(expert.id, date);
    const session = await getSession();

    return privateJson({
      expertId: expert.id,
      date,
      slots,
      range: bookableRange(),
      // lets the form skip the login round-trip and ask for an account up front
      authenticated: !!session,
    });
  } catch (err) {
    logFailure("availability", err);
    return errors.server();
  }
}
