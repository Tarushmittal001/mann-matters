import { prisma } from "@/lib/db";
import { createSession, getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit, resetLimit } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Body = { currentPassword?: string; newPassword?: string };

/**
 * POST /api/profile/password
 *
 * Changing a password requires proving you know the current one, even though
 * the session already says who you are — that's what stops a borrowed laptop
 * from becoming a permanent account takeover.
 *
 * The session is re-issued afterwards so the cookie in use is one minted after
 * the change.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const limited = rateLimit("password", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const current = body.currentPassword ?? "";
    const next = body.newPassword ?? "";

    const invalid = validatePassword(next);
    if (invalid) return errors.validation({ newPassword: invalid });

    if (current === next) {
      return errors.validation({
        newPassword: "Please choose a password you haven't used here before.",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) return errors.notFound("We couldn't find your account.");

    const matches = await verifyPassword(current, user.passwordHash);
    if (!matches) {
      return errors.validation({ currentPassword: "That isn't your current password." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(next) },
    });

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    resetLimit("password", clientKey(req));

    return privateJson({ ok: true, message: "Your password has been changed." });
  } catch (err) {
    logFailure("profile.password", err);
    return errors.server();
  }
}
