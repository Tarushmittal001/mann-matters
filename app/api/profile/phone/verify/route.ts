import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientKey, errors, isSameOrigin, logFailure, privateJson, readJson } from "@/lib/http";
import { consumePhoneOtp } from "@/lib/phone-otp";
import { rateLimit } from "@/lib/rate-limit";
import { validateOtp } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Body = { code?: string };

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return errors.crossOrigin();
    const session = await getSession();
    if (!session) return errors.unauthenticated();

    const body = await readJson<Body>(request);
    if (!body) return errors.badBody();
    const code = body.code?.trim() ?? "";
    const codeError = validateOtp(code);
    if (codeError) return errors.validation({ code: codeError });

    const limited = rateLimit("otpVerify", clientKey(request));
    if (!limited.ok) return errors.rateLimited(limited.retryAfter);

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, phone: true },
    });
    const valid = user?.phone ? await consumePhoneOtp(user.id, user.phone, code) : false;
    if (!user?.phone || !valid) {
      return privateJson(
        { error: "That code is incorrect or has expired.", code: "BAD_OTP" },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: new Date() },
    });
    return privateJson({ verified: true });
  } catch (error) {
    logFailure("profile.phone.verify", error);
    return errors.server();
  }
}