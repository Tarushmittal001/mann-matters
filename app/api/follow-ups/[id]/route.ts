import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errors, isSameOrigin, logFailure, privateJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/follow-ups/:id — the client answering a suggestion.
 *
 * Only ever their own: the row is addressed by id AND by the signed-in user,
 * so somebody else's suggestion is a 404 rather than something to dismiss.
 * Dismissing is deliberately quiet — the practitioner sees that it was
 * answered, not that it was refused, because "no thank you" does not need to
 * be reported back to a therapist as a rejection.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const done = await prisma.followUp.updateMany({
      where: { id: params.id, userId: session.sub, actedAt: null },
      data: { actedAt: new Date(), outcome: "DISMISSED" },
    });
    if (done.count === 0) return errors.notFound("That suggestion is no longer there.");

    return privateJson({ ok: true });
  } catch (err) {
    logFailure("follow-ups.dismiss", err);
    return errors.server();
  }
}
