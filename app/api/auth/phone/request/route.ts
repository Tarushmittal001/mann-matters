import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { clientKey, errors, fail, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { issuePhoneOtp } from "@/lib/phone-otp";
import { rateLimit } from "@/lib/rate-limit";
import { hasSmsProvider, sendSignInOtp } from "@/lib/sms";
import { normalisePhone, validateRequiredPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Body = { phone?: string };

function phoneKey(phone: string) {
  return createHash("sha256").update(phone).digest("hex");
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return errors.crossOrigin();

    const body = await readJson<Body>(request);
    if (!body) return errors.badBody();

    const rawPhone = body.phone ?? "";
    const phoneError = validateRequiredPhone(rawPhone);
    if (phoneError) return errors.validation({ phone: phoneError });

    const phone = normalisePhone(rawPhone);
    const byClient = rateLimit("otpRequest", clientKey(request));
    const byPhone = rateLimit("otpRequest", phoneKey(phone));
    if (!byClient.ok || !byPhone.ok) {
      const retryAfter = Math.max(
        byClient.ok ? 0 : byClient.retryAfter,
        byPhone.ok ? 0 : byPhone.retryAfter
      );
      return errors.rateLimited(retryAfter);
    }

    if (process.env.NODE_ENV === "production" && !hasSmsProvider()) {
      return fail(503, "Phone sign-in is temporarily unavailable. Please use email instead.", {
        code: "SMS_UNAVAILABLE",
      });
    }

    const user = await prisma.user.findFirst({ where: { phone, phoneVerified: { not: null } } });
    let devCode: string | undefined;

    if (user) {
      const code = await issuePhoneOtp(user.id, phone);
      if (hasSmsProvider()) {
        const delivery = await sendSignInOtp(phone, code);
        if (!delivery.sent) {
          await prisma.phoneOtp.deleteMany({ where: { userId: user.id } });
          logFailure("auth.phone.request", new Error(delivery.reason));
          return fail(503, "We couldn't send a code just now. Please use email or try again.", {
            code: "SMS_FAILED",
          });
        }
      } else {
        devCode = code;
      }
    }

    return privateJson({
      ok: true,
      message: "If that number is linked to an account, a code is on its way.",
      ...(devCode ? { devCode } : {}),
    });
  } catch (error) {
    logFailure("auth.phone.request", error);
    return errors.server();
  }
}