import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { issueResetToken } from "@/lib/password-reset";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/forgot — send a "set a new password" link.
 *
 * The answer is the same whether or not the address has an account: telling a
 * stranger which emails are registered here would say who is in therapy.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const body = await readJson<{ email?: string }>(req);
    if (!body) return errors.badBody();

    const email = (body.email ?? "").trim().toLowerCase();
    const invalid = validateEmail(email);
    if (invalid) return errors.validation({ email: invalid });

    const perIp = rateLimit("forgot", clientKey(req));
    const perEmail = rateLimit("forgot", `email:${email}`);
    if (!perIp.ok) return errors.rateLimited(perIp.retryAfter);
    if (!perEmail.ok) return errors.rateLimited(perEmail.retryAfter);

    const user = await prisma.user.findUnique({ where: { email } });
    let devLink: string | undefined;

    if (user) {
      const token = await issueResetToken(user.id);
      const link = `${new URL(req.url).origin}/reset-password?token=${token}`;
      const delivery = await sendPasswordResetEmail(user.email, user.name, link);
      devLink = delivery.devLink;
    }

    return privateJson({
      ok: true,
      message: "If that email has an account, a reset link is on its way.",
      // only ever set in development, and only when no mail provider is configured
      ...(devLink ? { devLink } : {}),
    });
  } catch (err) {
    logFailure("auth.forgot", err);
    return errors.server();
  }
}
