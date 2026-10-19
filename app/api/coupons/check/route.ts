import { getSession } from "@/lib/auth";
import { resolveCode } from "@/lib/coupons";
import { priceForBooking } from "@/lib/service-catalogue";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Body = { code?: string; expertId?: string; service?: string };

/**
 * POST /api/coupons/check — what would this code do to this session's price?
 *
 * Read-only: it spends nothing and reserves nothing, so refreshing the page
 * with a code in the box costs the code nothing. The price is read from the
 * catalogue for this practitioner and this service, exactly as the booking
 * route reads it, so the number quoted here is the number that will be
 * charged.
 *
 * Rate-limited, because an open endpoint that says "yes, that's a real code"
 * is a code-guessing oracle otherwise.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const limited = await rateLimit("coupon", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body?.code || !body.service || !body.expertId) return errors.badBody();

    /*
     * Priced off the practitioner AND the service, exactly as the booking
     * route prices it. Pricing off the service alone quoted a discount
     * against a number that was not this session's price the moment a
     * practitioner set their own rate — the code would then appear to save
     * more, or less, than it really does.
     */
    const price = await priceForBooking(body.expertId, body.service);
    if (price === null) return errors.notFound("We couldn't price that session.");

    const result = await resolveCode(body.code, session.sub, price);

    return result.ok
      ? privateJson({ discount: result.discount })
      : privateJson({ error: result.reason }, { status: 422 });
  } catch (err) {
    logFailure("coupons.check", err);
    return errors.server();
  }
}
