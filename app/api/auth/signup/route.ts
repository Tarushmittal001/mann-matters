import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { issueVerificationToken } from "@/lib/verification";
import { sendVerificationEmail, type DeliveryResult } from "@/lib/email";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { collect, hasErrors, validateEmail, validateName, validatePassword } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Body = { name?: string; email?: string; password?: string };

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const limited = rateLimit("signup", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    const fields = collect([
      ["name", validateName(name)],
      ["email", validateEmail(email)],
      ["password", validatePassword(password)],
    ]);
    if (hasErrors(fields)) return errors.validation(fields);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // this one does reveal that an address is taken — the alternative is
      // people who already have an account being unable to work out why signup
      // "worked" but login doesn't. The message points at the recovery path.
      return errors.validation(
        { email: "An account with this email already exists. Try signing in." },
        "An account with this email already exists."
      );
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
    });

    // a verification link, and no session until they follow it
    const token = await issueVerificationToken(user.id);
    const link = `${new URL(req.url).origin}/verify?token=${token}`;

    let delivery: DeliveryResult | null = null;
    try {
      delivery = await sendVerificationEmail(user.email, user.name, link);
    } catch (err) {
      // a mailer hiccup shouldn't lose the account they just made — they can resend
      logFailure("auth.signup.email", err);
    }

    return privateJson({
      pendingVerification: true,
      email: user.email,
      // false when no provider is configured, so the screen can say so plainly
      // rather than telling someone to check an inbox nothing was sent to
      emailSent: delivery?.delivered ?? false,
      // development only — `sendVerificationEmail` returns this exclusively when
      // NODE_ENV !== "production" and no mailer is wired up
      devLink: delivery?.devLink,
    });
  } catch (err) {
    logFailure("auth.signup", err);
    return errors.server();
  }
}
