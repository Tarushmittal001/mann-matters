import { createSession } from "@/lib/auth";
import { consumeVerificationToken } from "@/lib/verification";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    // the token is high-entropy, but a limit keeps anyone from grinding at it
    const limited = rateLimit("verify", clientKey(req));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const body = await readJson<{ token?: string }>(req);
    if (!body) return errors.badBody();

    const user = await consumeVerificationToken((body.token ?? "").trim());
    if (!user) {
      return privateJson(
        {
          error: "This link is invalid or has expired. Please request a new one.",
          code: "BAD_TOKEN",
        },
        { status: 400 }
      );
    }

    // verified — log them straight in
    await createSession(user);
    return privateJson({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    logFailure("auth.verify", err);
    return errors.server();
  }
}
