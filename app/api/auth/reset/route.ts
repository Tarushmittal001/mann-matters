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

    const limited = await rateLimit("reset", clientKey(req));
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

    /* Checked before the password is written, not after. A blocked account
       having its credentials quietly rotated by whoever holds the link is a
       change we would be making to an account we have closed. */
    if (user.blockedAt) return errors.blocked();

    /* When this reset is the FIRST proof anyone has given of the inbox, every
       other credential on the account was set by somebody who never proved it.
       Signup verifies the phone by SMS but not the email, so a stranger can open
       an account in someone else's email with their own phone, wait for the real
       owner to "recover" it here, and keep signing in by phone OTP. The new
       password and passwordChangedAt shut out the old password and sessions;
       dropping the unproven phone shuts out the last door. The owner re-links
       their own number from the profile page. */
    const firstProofOfEmail = !user.emailVerified;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(body.password ?? ""),
          passwordChangedAt: new Date(),
          // reading the email proves the address, so an unconfirmed account is confirmed here
          emailVerified: user.emailVerified ?? new Date(),
          ...(firstProofOfEmail ? { phone: null, phoneVerified: null } : {}),
        },
      }),
      ...(firstProofOfEmail ? [prisma.phoneOtp.deleteMany({ where: { userId: user.id } })] : []),
    ]);
    await clearResetTokens(user.id);

    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });

    return privateJson({ ok: true, role: user.role });
  } catch (err) {
    logFailure("auth.reset", err);
    return errors.server();
  }
}
