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
    const byClient = rateLimit("otpVerify", clientKey(request));
    const byPhone = rateLimit("otpVerify", identifier);
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

    await createSession(user);
    resetLimit("otpVerify", identifier);
    return privateJson({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    logFailure("auth.phone.verify", error);
    return errors.server();
  }
}