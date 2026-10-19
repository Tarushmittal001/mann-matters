import { prisma } from "@/lib/db";
import { record } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/coupons/:id  { action: "pause" | "resume" | "delete" }
 *
 * A code that has been used is never deleted, only paused. The redemptions
 * hanging off it are part of the money record — what a client paid and why —
 * and deleting the code would take the "why" out of the books. Pausing stops
 * it being accepted, which is the thing anybody actually wants.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const body = await readJson<{ action?: string }>(req);
    const action = body?.action;

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      select: { id: true, code: true, usedCount: true, ownerId: true },
    });
    if (!coupon) return errors.notFound("That code no longer exists.");

    if (action === "pause" || action === "resume") {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: action === "pause" ? "PAUSED" : "ACTIVE" },
      });
      await record(
        session,
        "coupon.update",
        { type: "coupon", id: coupon.code },
        `${action === "pause" ? "Paused" : "Resumed"} discount code ${coupon.code}`
      );
      return privateJson({ ok: true, status: action === "pause" ? "PAUSED" : "ACTIVE" });
    }

    if (action === "delete") {
      if (coupon.usedCount > 0) {
        return privateJson(
          {
            error:
              "Somebody has already used this code, so it stays in the books. Pause it instead — it stops working immediately.",
            code: "IN_USE",
          },
          { status: 409 }
        );
      }
      if (coupon.ownerId) {
        return privateJson(
          {
            error: "This is a referral reward somebody has earned. Pause it if you must, but it isn't ours to delete.",
            code: "EARNED",
          },
          { status: 409 }
        );
      }
      await prisma.coupon.delete({ where: { id: coupon.id } });
      await record(
        session,
        "coupon.delete",
        { type: "coupon", id: coupon.code },
        `Deleted discount code ${coupon.code}`
      );
      return privateJson({ ok: true, deleted: true });
    }

    return errors.badBody();
  } catch (err) {
    logFailure("admin.coupons.update", err);
    return errors.server();
  }
}
