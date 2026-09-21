import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { clearResetTokens, resetTokenOwner } from "@/lib/password-reset";
import { clientKey, errors, fail, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/reset — set a new password using an emailed link.
 *
 * The link proves the person can read that inbox, so this also confirms the
 * email address, stamps `passwordChangedAt` (which signs out every older
 * session) and signs them in on this device.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const limited = rateLimit("reset", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<{ token?: string; password?: string }>(req);
    if (!body) return errors.badBody();

    const weak = validatePassword(body.password ?? "");
    if (weak) return errors.validation({ password: weak });

    const user = await resetTokenOwner((body.token ?? "").trim());
    if (!user) {
      return fail(410, "That link has expired or has already been used. Please ask for a new one.", {
        code: "RESET_LINK_INVALID",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(body.password ?? ""),
        passwordChangedAt: new Date(),
        // reading the email proves the address, so an unconfirmed account is confirmed here
        emailVerified: user.emailVerified ?? new Date(),
      },
    });
    await clearResetTokens(user.id);

    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });

    return privateJson({ ok: true, role: user.role });
  } catch (err) {
    logFailure("auth.reset", err);
    return errors.server();
  }
}
