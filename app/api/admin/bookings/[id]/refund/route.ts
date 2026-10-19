import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { record } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { PAYMENT_STATUS, refundableAmount } from "@/lib/features/booking/policy";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { refund } from "@/lib/payments";
import { monthOf } from "@/lib/payouts";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bookings/:id/refund  { amount?, reason }
 *
 * Giving money back when the cancellation policy would not have.
 *
 * The client-facing path (`/api/bookings/:id/cancel`) pays out only what
 * `refundFor` allows: everything outside the 24-hour window, nothing inside
 * it. That rule is right for a client changing their mind and wrong for a
 * practitioner who did not turn up, a room that never opened, or a complaint
 * worth settling. This is the override, and the reason is required because an
 * override with no reason is indistinguishable from a mistake.
 *
 * ── WHAT IT DOES NOT DO ────────────────────────────────────────────────────
 * It does not cancel the session. Refunding and cancelling are different
 * decisions — a session that happened badly is still a session that happened,
 * and a practitioner's calendar should not rewrite itself because money moved.
 * Cancel separately if that is what you mean.
 *
 * ── THE AMOUNT ─────────────────────────────────────────────────────────────
 * Bounded server-side by `refundableAmount`: at most what is left of what was
 * actually collected. A partial refund leaves the payment PAID with a running
 * `refundAmount`; only when nothing is left does it become REFUNDED. Calling a
 * half-returned payment "Refunded" on every screen would mislead more than it
 * informs.
 */

const REASON_MAX = 300;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const limited = await rateLimit("adminRefund", `admin:${session.sub || clientKey(req)}`);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<{ amount?: number; reason?: string }>(req);
    if (!body) return errors.badBody();

    const reason = (body.reason ?? "").trim();
    if (!reason) return errors.validation({ reason: "Please say why, for the record." });
    if (reason.length > REASON_MAX) {
      return errors.validation({ reason: `Please keep this under ${REASON_MAX} characters.` });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ref: true,
        date: true,
        userId: true,
        expertId: true,
        expertName: true,
        user: { select: { name: true } },
        payment: {
          select: { id: true, status: true, amount: true, refundAmount: true, reference: true },
        },
      },
    });
    if (!booking) return errors.notFound("We couldn't find that session.");

    const { max, alreadyBack, reason: why } = refundableAmount(booking.payment);
    if (max <= 0) return privateJson({ error: why, code: "NOTHING_TO_REFUND" }, { status: 409 });

    /* Default to the rest of it; a number given is checked against what is
       actually left, never trusted. Whole rupees only — a fraction of a rupee
       is a rounding artefact, not an instruction. */
    const wanted = body.amount === undefined ? max : Math.trunc(Number(body.amount));
    if (!Number.isFinite(wanted) || wanted <= 0) {
      return errors.validation({ amount: "Enter an amount greater than zero." });
    }
    if (wanted > max) {
      return errors.validation({
        amount: `There is only ₹${max} left to refund on this payment.`,
      });
    }

    // the gateway first: if the money does not move, nothing should be written
    const result = await refund(wanted);

    const totalBack = alreadyBack + wanted;
    const full = totalBack >= booking.payment!.amount;

    await prisma.payment.update({
      where: { id: booking.payment!.id },
      data: {
        refundAmount: totalBack,
        refundedAt: new Date(),
        status: full ? PAYMENT_STATUS.refunded : PAYMENT_STATUS.paid,
        reference: result.reference,
      },
    });

    /* A payout already marked sent for the month this session was held in has
       now been overpaid: the practitioner's share was worked out before this
       money went back. Nothing is clawed back automatically — that is between
       two people — but the admin is told, and the payout row keeps showing
       what was sent against what is now owed. */
    const month = monthOf(booking.date);
    const settled = await prisma.payout.findUnique({
      where: { expertId_month: { expertId: booking.expertId, month } },
      select: { amount: true },
    });

    await record(
      session,
      "payment.refund",
      { type: "booking", id: booking.id },
      `Refunded ₹${wanted} on ${booking.ref} (${booking.user.name}): ${reason}`,
      { amount: wanted, full, totalRefunded: totalBack, ref: booking.ref }
    );

    revalidatePath("/admin/payments");
    revalidatePath("/admin/revenue");
    revalidatePath(`/admin/clients/${booking.userId}`, "page");

    return privateJson({
      ok: true,
      refunded: wanted,
      totalRefunded: totalBack,
      remaining: booking.payment!.amount - totalBack,
      full,
      reference: result.reference,
      // null unless this undercuts a payout already sent
      payoutAlreadySent: settled
        ? { month, amount: settled.amount, expertName: booking.expertName }
        : null,
    });
  } catch (err) {
    logFailure("admin.bookings.refund", err);
    return errors.server();
  }
}
