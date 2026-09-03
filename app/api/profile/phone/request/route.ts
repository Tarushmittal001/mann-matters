import { createHash } from "node:crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientKey, errors, fail, isSameOrigin, logFailure, privateJson } from "@/lib/http";
import { issuePhoneOtp } from "@/lib/phone-otp";
import { rateLimit } from "@/lib/rate-limit";
import { hasSmsProvider, sendSignInOtp } from "@/lib/sms";

export const dynamic = "force-dynamic";

function phoneKey(phone: string) {
  return createHash("sha256").update(phone).digest("hex");
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, phone: true, phoneVerified: true },
    });
    if (!user) return errors.notFound("We couldn't find your account.");
    if (!user.phone) {
      return fail(422, "Save a mobile number before requesting a code.", {
        code: "PHONE_REQUIRED",
      });
    }
    if (user.phoneVerified) return privateJson({ ok: true, alreadyVerified: true });

    const byClient = rateLimit("otpRequest", clientKey(request));
    const byPhone = rateLimit("otpRequest", phoneKey(user.phone));
    if (!byClient.ok || !byPhone.ok) {
      return errors.rateLimited(
        Math.max(byClient.ok ? 0 : byClient.retryAfter, byPhone.ok ? 0 : byPhone.retryAfter)
      );
    }

    if (process.env.NODE_ENV === "production" && !hasSmsProvider()) {
      return fail(503, "Phone verification is temporarily unavailable.", {
        code: "SMS_UNAVAILABLE",
      });
    }

    const code = await issuePhoneOtp(user.id, user.phone);
    if (hasSmsProvider()) {
      const delivery = await sendSignInOtp(user.phone, code);
      if (!delivery.sent) {
        await prisma.phoneOtp.deleteMany({ where: { userId: user.id } });
        logFailure("profile.phone.request", new Error(delivery.reason));
        return fail(503, "We couldn't send a code just now. Please try again.", {
          code: "SMS_FAILED",
        });
      }
    }

    return privateJson({ ok: true, ...(hasSmsProvider() ? {} : { devCode: code }) });
  } catch (error) {
    logFailure("profile.phone.request", error);
    return errors.server();
  }
}