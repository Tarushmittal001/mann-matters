import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { FEEDBACK_STATUS } from "@/lib/feedback";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/feedback/:id  { action: "approve" | "hide" }
 *
 * Admin moderation for "We heard you". The home page is regenerated right away,
 * so an approved story shows (or a hidden one disappears) without a redeploy.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();
    if (session.role !== "ADMIN") return errors.forbidden();

    const body = await readJson<{ action?: string }>(req);
    const status =
      body?.action === "approve" ? FEEDBACK_STATUS.approved : body?.action === "hide" ? FEEDBACK_STATUS.hidden : null;
    if (!status) return errors.badBody();

    const updated = await prisma.feedback.updateMany({
      where: { id: params.id },
      data: { status, reviewedAt: new Date() },
    });
    if (updated.count === 0) return errors.notFound("That feedback no longer exists.");

    revalidatePath("/");
    return privateJson({ ok: true, status });
  } catch (err) {
    logFailure("admin.feedback", err);
    return errors.server();
  }
}
