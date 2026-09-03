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
    const limited = rateLimit("login", key);
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
    resetLimit("login", key);

    return privateJson({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    logFailure("auth.login", err);
    return errors.server();
  }
}
