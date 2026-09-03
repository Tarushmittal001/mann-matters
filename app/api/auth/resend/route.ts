import { prisma } from "@/lib/db";
import { issueVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// one reply for every case — never reveal whether an address is registered.
// `devLink` is the sole exception, and only outside production: without a mail
// provider there is otherwise no way to finish signing up on a dev machine.
const generic = (devLink?: string) =>
  privateJson({
    ok: true,
    message: "If that account needs confirming, a fresh link is on its way.",
    ...(devLink ? { devLink } : {}),
  });

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) return errors.crossOrigin();

    const limited = rateLimit("resend", clientKey(req));
    // even the limiter's reply is the generic one, so a blocked caller learns
    // nothing about the address they asked about
    if (!limited.ok) return generic();

    const body = await readJson<{ email?: string }>(req);
    if (!body) return errors.badBody();

    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email) return generic();

    const user = await prisma.user.findUnique({ where: { email } });

    // only act for real, still-unverified accounts; the reply is identical either way
    if (user && !user.emailVerified) {
      const recent = await prisma.verificationToken.findFirst({
        where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
      });
      if (!recent) {
        const token = await issueVerificationToken(user.id);
        const link = `${new URL(req.url).origin}/verify?token=${token}`;
        try {
          const delivery = await sendVerificationEmail(user.email, user.name, link);
          if (delivery.devLink) return generic(delivery.devLink);
        } catch (err) {
          logFailure("auth.resend.email", err);
        }
      }
    }

    return generic();
  } catch (err) {
    logFailure("auth.resend", err);
    return generic();
  }
}
