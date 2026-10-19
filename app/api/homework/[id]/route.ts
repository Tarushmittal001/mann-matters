import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/homework/:id  { done: boolean }
 *
 * The client ticking their own task off, and un-ticking it. Scoped to the
 * signed-in user, so the id in the path can only ever address their own work.
 *
 * Un-ticking is allowed deliberately: somebody who marks a thing done and then
 * realises they didn't really do it should be able to say so without it
 * costing them anything. Nobody is scored on this.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const body = await readJson<{ done?: boolean }>(req);
    if (typeof body?.done !== "boolean") return errors.badBody();

    const { count } = await prisma.homework.updateMany({
      where: { id: params.id, userId: session.sub },
      data: { doneAt: body.done ? new Date() : null },
    });
    if (count === 0) return errors.notFound("That task no longer exists.");

    return privateJson({ ok: true, done: body.done });
  } catch (err) {
    logFailure("homework.tick", err);
    return errors.server();
  }
}
