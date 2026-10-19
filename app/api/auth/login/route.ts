import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit, resetLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Body = { email?: string; password?: string };

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const key = clientKey(req);
    const limited = await rateLimit("login", key);
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<Body>(req);
    if (!body) return errors.badBody();

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    const ok = user && (await verifyPassword(password, user.passwordHash));

    if (!ok) {
      // one message for "no such account" and for "wrong password" — telling
      // them apart would turn this endpoint into an account-existence oracle
      return privateJson(
        { error: "Email or password is incorrect.", code: "BAD_CREDENTIALS" },
        { status: 401 }
      );
    }

    /* Only after the password checked out. Saying "this account is blocked" to
       somebody who could not prove they own it would be an existence oracle;
       saying it to somebody who just typed the right password tells them
       nothing they did not already know. The alternative — a blocked person
       retyping a password they know is correct, forever, against a message
       that says it is wrong — is a cruelty we would be choosing. The reason an
       admin recorded is internal and is NOT repeated here. */
    if (user.blockedAt) return errors.blocked();

    if (!user.emailVerified) {
      return privateJson(
        {
          error:
            "Please confirm your email first. Check your inbox for the link — we can resend it.",
          code: "UNVERIFIED",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    await createSession(user);
    await resetLimit("login", key);

    return privateJson({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    logFailure("auth.login", err);
    return errors.server();
  }
}
