import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { record } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { monthLabel, payoutsForMonth, recentMonths } from "@/lib/payouts";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/payouts  { expertId, month, reference? }  — record it as sent
 * POST /api/admin/payouts  { expertId, month, undo: true }  — take that back
 *
 * The one thing about payouts that cannot be computed. Everything else on the
 * revenue page is derived from sessions; whether the money actually left the
 * bank is a fact only a person knows, so a person records it.
 *
 * The amount is NOT taken from the request. It is recomputed here from the
 * month's sessions, so what gets written is what we owed at the moment it was
 * marked — a browser cannot propose its own figure, and the stored number
 * stops moving afterwards even if the share or a refund changes later.
 */

const REFERENCE_MAX = 80;

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const body = await readJson<{
      expertId?: string;
      month?: string;
      reference?: string;
      undo?: boolean;
    }>(req);
    if (!body?.expertId || !body?.month) return errors.badBody();

    // a month we actually show, so a typo cannot create a row for "0000-13"
    if (!recentMonths(24).includes(body.month)) {
      return errors.validation({ month: "That isn't a month on the books." });
    }

    const reference = (body.reference ?? "").trim();
    if (reference.length > REFERENCE_MAX) {
      return errors.validation({ reference: `Please keep this under ${REFERENCE_MAX} characters.` });
    }

    if (body.undo) {
      const gone = await prisma.payout.deleteMany({
        where: { expertId: body.expertId, month: body.month },
      });
      if (gone.count === 0) return errors.notFound("There is no payout recorded for that month.");

      await record(
        session,
        "payout.undo",
        { type: "payout", id: `${body.expertId}:${body.month}` },
        `Undid the ${monthLabel(body.month)} payout record for ${body.expertId}`
      );
      revalidatePath("/admin/revenue");
      revalidatePath("/admin/payments");
      return privateJson({ ok: true, settled: null });
    }

    /* Recomputed, never taken from the request. */
    const owed = (await payoutsForMonth(body.month)).find((p) => p.expertId === body.expertId);
    if (!owed) {
      return errors.notFound("That practitioner held no sessions in that month.");
    }

    const payout = await prisma.payout.upsert({
      where: { expertId_month: { expertId: body.expertId, month: body.month } },
      update: { amount: owed.due, reference: reference || null },
      create: {
        expertId: body.expertId,
        month: body.month,
        amount: owed.due,
        reference: reference || null,
        markedById: session.sub,
        markedByEmail: session.email,
      },
    });

    await record(
      session,
      "payout.mark",
      { type: "payout", id: `${body.expertId}:${body.month}` },
      `Marked ${monthLabel(body.month)} paid to ${owed.expertName} — ₹${owed.due}`,
      { amount: owed.due, reference: reference || null }
    );

    revalidatePath("/admin/revenue");
    revalidatePath("/admin/payments");

    return privateJson({
      ok: true,
      settled: {
        amount: payout.amount,
        paidAt: payout.paidAt.toISOString(),
        reference: payout.reference,
        markedByEmail: payout.markedByEmail,
      },
    });
  } catch (err) {
    logFailure("admin.payouts", err);
    return errors.server();
  }
}
