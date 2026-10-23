import { createHash } from "node:crypto";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { consumePhoneOtp } from "@/lib/phone-otp";
import { rateLimit, resetLimit } from "@/lib/rate-limit";
import {
  normalisePhone,
  validateOtp,
  validateRequiredPhone,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

type Body = { phone?: string; code?: string };

function phoneKey(phone: string) {
  return createHash("sha256").update(phone).digest("hex");
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return errors.crossOrigin();

    const body = await readJson<Body>(request);
    if (!body) return errors.badBody();

    const rawPhone = body.phone ?? "";
    const code = body.code?.trim() ?? "";
    const phoneError = validateRequiredPhone(rawPhone);
    const codeError = validateOtp(code);
    if (phoneError || codeError) {
      return errors.validation({
        ...(phoneError ? { phone: phoneError } : {}),
        ...(codeError ? { code: codeError } : {}),
      });
    }

    const phone = normalisePhone(rawPhone);
    const identifier = phoneKey(phone);
    const byClient = await rateLimit("otpVerify", clientKey(request));
    const byPhone = await rateLimit("otpVerify", identifier);
    if (!byClient.ok || !byPhone.ok) {
      const retryAfter = Math.max(
        byClient.ok ? 0 : byClient.retryAfter,
        byPhone.ok ? 0 : byPhone.retryAfter
      );
      return errors.rateLimited(retryAfter);
    }

    const user = await prisma.user.findFirst({ where: { phone, phoneVerified: { not: null } } });
    const valid = user ? await consumePhoneOtp(user.id, phone, code) : false;
    if (!user || !valid) {
      return privateJson(
        { error: "That code is incorrect or has expired.", code: "BAD_OTP" },
        { status: 401 }
      );
    }

    // the code proved the number is theirs, so the block can be named
    if (user.blockedAt) return errors.blocked();

    /* The same rule as password sign-in, and here it is the boundary. Signup
       proves the phone by SMS but the email only later, by its link — so an
       account with an unconfirmed email may be one somebody opened in another
       person's name, with their own phone attached. Until whoever reads that
       inbox has confirmed it, the phone signs nobody in. (A password reset that
       confirms the email also detaches that phone: see /api/auth/reset.) */
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
    await resetLimit("otpVerify", identifier);
    return privateJson({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    logFailure("auth.phone.verify", error);
    return errors.server();
  }
}