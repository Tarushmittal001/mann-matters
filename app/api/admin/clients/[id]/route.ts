import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { record } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/clients/:id  { action: "block", reason } | { action: "unblock" }
 *
 * Closing or reopening a client's account.
 *
 * ── WHAT BLOCKING DOES, AND WHAT IT DELIBERATELY DOES NOT ──────────────────
 * It sets three columns. `getSession()` reads `blockedAt` on every request, so
 * the account is shut out of every page and every API route the moment this
 * returns — including a cookie minted a minute ago.
 *
 * It does NOT touch their bookings, payments or receipts. Two reasons: the
 * record of what happened is not ours to erase because we fell out with
 * somebody, and a practitioner's calendar should not rearrange itself behind
 * their back. Upcoming sessions are listed on the client's page instead, for
 * an admin to deal with one at a time.
 *
 * An admin cannot block another admin or a practitioner here. This route is
 * scoped to `role: "USER"`, so an id belonging to staff is a 404 — removing a
 * colleague's access is a different decision with different consequences, and
 * it should not be a mis-click on the client screen.
 */

const REASON_MAX = 300;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const body = await readJson<{ action?: string; reason?: string }>(req);
    if (!body || (body.action !== "block" && body.action !== "unblock")) return errors.badBody();

    const blocking = body.action === "block";
    const reason = (body.reason ?? "").trim();
    if (blocking && !reason) {
      // a block with no reason is a mystery for whoever reads it next, which is
      // usually you, months later, with somebody on the phone asking why
      return errors.validation({ reason: "Please say why, for the record." });
    }
    if (reason.length > REASON_MAX) {
      return errors.validation({ reason: `Please keep this under ${REASON_MAX} characters.` });
    }

    const client = await prisma.user.findFirst({
      where: { id: params.id, role: "USER" },
      select: { id: true, name: true, blockedAt: true },
    });
    if (!client) return errors.notFound("That client couldn't be found.");

    if (blocking && client.blockedAt) {
      return privateJson({ ok: true, blockedAt: client.blockedAt.toISOString(), already: true });
    }
    if (!blocking && !client.blockedAt) {
      return privateJson({ ok: true, blockedAt: null, already: true });
    }

    const blockedAt = blocking ? new Date() : null;
    await prisma.user.update({
      where: { id: client.id },
      data: {
        blockedAt,
        blockedReason: blocking ? reason : null,
        blockedById: blocking ? session.sub : null,
      },
    });

    /* The reason is kept on the row and in the trail, because an account
       closure somebody has to answer for later is exactly what an audit log is
       for. It is never shown to the client: it was written as an internal
       note, not as a message to them. */
    await record(
      session,
      blocking ? "client.block" : "client.unblock",
      { type: "client", id: client.id },
      blocking ? `Blocked ${client.name}: ${reason}` : `Restored ${client.name}'s account`,
      blocking ? { reason } : {}
    );

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${client.id}`, "page");

    return privateJson({ ok: true, blockedAt: blockedAt?.toISOString() ?? null });
  } catch (err) {
    logFailure("admin.clients.block", err);
    return errors.server();
  }
}
